// vite-plugin-generate-app-index.js
//
// Generates the app "index" (layout + pages + routing metadata) as a virtual
// module, discovered from the filesystem at build/dev time instead of being
// wired up by the Blocks compiler service. The page `id`/`name` is the source
// filename (without extension).
//
// Two output shapes, selected via `mode`:
//
//  - 'standalone' (pnpm dev / pnpm build:standalone): index.html -> src/main.tsx
//    imports `virtual:blocks-app-index` and reads the `default`/`__standalone`
//    export ({ layout, pages, defaultPageId }).
//
//  - 'umd' (cloud / S3 bundle): rollup input is the virtual module; the UMD
//    bundle exposes `window.compiler`. app-render destructures `AppLayout` as the
//    layout and treats every OTHER named export as a page. So in this mode we emit
//    ONLY `AppLayout` + one named export per page (no default/__standalone, which
//    would otherwise be picked up as broken pages).
import fs from 'fs';
import path from 'path';

const VIRTUAL_ID = 'virtual:blocks-app-index';
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID;

// Layout export name expected by app-render's DataProvider (destructured out of
// window.compiler so it is not mistaken for a page).
const LAYOUT_EXPORT_NAME = 'AppLayout';

// Page filenames whose basename (case-insensitive) is treated as the landing page.
const DEFAULT_PAGE_PREFERENCE = ['main', 'home', 'index', 'dashboard'];

function toIdentifier(value, fallback) {
  const cleaned = value.replace(/[^a-zA-Z0-9_$]/g, '_');
  return /^[a-zA-Z_$]/.test(cleaned) ? cleaned : `_${cleaned || fallback}`;
}

function walkTsxFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkTsxFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      out.push(fullPath);
    }
  }
  return out;
}

function collectPages(pagesDir) {
  const files = walkTsxFiles(pagesDir).sort();
  return files.map((file) => {
    const relFromPages = path
      .relative(pagesDir, file)
      .split(path.sep)
      .join('/')
      .replace(/\.tsx$/, '');
    return {
      // Filename (path relative to src/pages, without extension) is the id/name.
      id: relFromPages,
      name: relFromPages,
      basename: path.basename(file, '.tsx'),
      importPath: `@/pages/${relFromPages}`,
    };
  });
}

function pickDefaultPageId(pages) {
  for (const preferred of DEFAULT_PAGE_PREFERENCE) {
    const match = pages.find((p) => p.basename.toLowerCase() === preferred);
    if (match) {
      return match.id;
    }
  }
  return pages[0]?.id ?? '';
}

function generateModule(srcDir, mode) {
  const pages = collectPages(path.join(srcDir, 'pages'));
  const hasLayout = fs.existsSync(path.join(srcDir, 'layout.tsx'));

  const lines = mode === 'umd' ? ["import '@/index.css';"] : [];

  if (hasLayout) {
    lines.push("import React from 'react';");
    lines.push("import { Toaster } from '@/components/ui/sonner';");
    lines.push("import Layout from '@/layout';");
  }

  const usedExportNames = new Set([LAYOUT_EXPORT_NAME]);
  const pageExportNames = [];
  pages.forEach((page, index) => {
    const importVar = `__page${index}`;
    lines.push(`import ${importVar} from ${JSON.stringify(page.importPath)};`);

    let exportName = toIdentifier(page.name, `Page${index}`);
    while (usedExportNames.has(exportName)) {
      exportName = `${exportName}_`;
    }
    usedExportNames.add(exportName);
    pageExportNames.push(exportName);

    lines.push(
      `export const ${exportName} = { id: ${JSON.stringify(page.id)}, name: ${JSON.stringify(page.name)}, component: ${importVar} };`,
    );
  });

  if (hasLayout) {
    lines.push(
      'const __LayoutComponent = ({ children }) => React.createElement(React.Fragment, null, React.createElement(Layout, { children }), React.createElement(Toaster));',
    );
    // Must be named `AppLayout` so app-render's DataProvider picks it up as the layout.
    lines.push(
      `export const ${LAYOUT_EXPORT_NAME} = { id: ${JSON.stringify(LAYOUT_EXPORT_NAME)}, name: ${JSON.stringify(LAYOUT_EXPORT_NAME)}, component: __LayoutComponent };`,
    );
  }

  // UMD/cloud bundle: only AppLayout + page named exports may be present, because
  // app-render treats every non-AppLayout named export as a page. A default or
  // __standalone export here would render as a broken page.
  if (mode === 'standalone') {
    const layoutExpr = hasLayout ? LAYOUT_EXPORT_NAME : 'null';
    const defaultPageId = pickDefaultPageId(pages);
    lines.push(
      `export const __standalone = { layout: ${layoutExpr}, pages: [${pageExportNames.join(', ')}], defaultPageId: ${JSON.stringify(defaultPageId)} };`,
    );
    lines.push('export default __standalone;');
  }

  return lines.join('\n') + '\n';
}

/**
 * @param {{ srcDir: string, mode: 'standalone' | 'umd' }} options
 */
export function generateAppIndexPlugin(options) {
  const srcDir = options.srcDir;
  const mode = options.mode;
  const pagesDir = path.join(srcDir, 'pages');
  const layoutFile = path.join(srcDir, 'layout.tsx');

  return {
    name: 'blocks-generate-app-index',
    resolveId(id) {
      if (id === VIRTUAL_ID) {
        return RESOLVED_VIRTUAL_ID;
      }
      return null;
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_ID) {
        return generateModule(srcDir, mode);
      }
      return null;
    },
    configureServer(server) {
      const invalidate = (file) => {
        const normalized = path.resolve(file);
        const isRelevant =
          normalized.startsWith(path.resolve(pagesDir) + path.sep) ||
          normalized === path.resolve(layoutFile);
        if (!isRelevant) {
          return;
        }
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
        }
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', invalidate);
      server.watcher.on('unlink', invalidate);
    },
  };
}
