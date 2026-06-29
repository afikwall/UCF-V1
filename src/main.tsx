/**
 * Standalone entry for pnpm dev / pnpm preview only.
 * This file is loaded by index.html in the boilerplate repo. It is NOT used by the SaaS
 * app-render (which loads the compiler's index.js UMD bundle from the compiler service).
 * We only run the standalone UI when loaded as the main entry from our index.html.
 */
import { ComponentType, StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router';
import {
  ClientProvider,
  ReactClientSdk,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import './index.css';
import { Login } from './Login';
import { loadFontsFromTheme } from './fonts';

// Must run before any import that uses getApiHost/getHost (e.g. SDK)
const apiHost = (import.meta as any).env?.VITE_BLOCKS_API_HOST as
  | string
  | undefined;
const appIdFromEnv = (import.meta as any).env?.VITE_APP_ID as
  | string
  | undefined;
if (typeof window !== 'undefined') {
  if (apiHost) {
    (window as any).__BLOCKS_API_HOST__ = apiHost;
  }
  if (appIdFromEnv) {
    (window as any).appId = appIdFromEnv;
  }
}

// Only run standalone UI when we were loaded by our index.html (not by SaaS app-render).
// SaaS loads the compiler's index.js UMD bundle, not this file.
if (
  typeof window !== 'undefined' &&
  (window as any).__BLOCKS_STANDALONE_ENTRY__
) {
  runApp();
}

function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const viteAppId = (import.meta as any).env?.VITE_APP_ID;
  if (viteAppId) {
    const token = window.localStorage.getItem(`token-${viteAppId}`);
    return token;
  }

  return window.localStorage.getItem('token');
}

async function runApp() {
  loadFontsFromTheme();
  const rootEl = document.getElementById('root');
  if (!rootEl) return;

  // Compiler exports layout and pages as { id, name, component } where .component is the React component
  let app: {
    layout: { id: string; name: string; component: ComponentType<any> } | null;
    pages: { id: string; name: string; component: ComponentType<any> }[];
    defaultPageId: string;
  };

  try {
    // Routing metadata (layout + pages) is generated from the filesystem by
    // vite-plugin-generate-app-index. Page id/name is the source filename.
    const index = await import('virtual:blocks-app-index');
    app = (index as any).default ?? (index as any).__standalone;
  } catch {
    rootEl.innerHTML = `
      <div style="padding: 2rem; font-family: system-ui; max-width: 480px;">
        <h2>No app bundle</h2>
        <p>Build the app in Blocks and push to this repo, or run from the Blocks platform.</p>
        <p>For local preview against Blocks backend:</p>
        <pre style="background: #f0f0f0; padding: 0.5rem;">VITE_BLOCKS_API_HOST=https://blocks.localhost
VITE_APP_ID=your-app-id
pnpm dev</pre>
      </div>
    `;
    return;
  }

  if (!app?.pages?.length) {
    rootEl.innerHTML = `
      <div style="padding: 2rem; font-family: system-ui;">
        <h2>No pages</h2>
        <p>This app has no pages yet. Add pages in Blocks and push to this repo.</p>
      </div>
    `;
    return;
  }

  const appId =
    appIdFromEnv ??
    (typeof window !== 'undefined' ? (window as any).appId : undefined);
  if (!appId && apiHost) {
    rootEl.innerHTML = `
      <div style="padding: 2rem; font-family: system-ui; max-width: 480px;">
        <h2>Set VITE_APP_ID</h2>
        <p>To talk to the Blocks backend locally, set:</p>
        <pre style="background: #f0f0f0; padding: 0.5rem;">VITE_BLOCKS_API_HOST=${apiHost}
VITE_APP_ID=your-app-id
pnpm dev</pre>
      </div>
    `;
    return;
  }

  const StandaloneApp = () => {
    const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'system'>(
      () =>
        (typeof window !== 'undefined' &&
          (localStorage.getItem('app-theme-mode') as
            | 'dark'
            | 'light'
            | 'system')) ||
        'system',
    );

    useEffect(() => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      const resolved =
        themeMode === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : themeMode;
      root.classList.add(resolved);
    }, [themeMode]);

    return (
      <ClientProvider
        client={client!}
        themeMode={themeMode}
        setThemeMode={(mode) => {
          if (typeof window !== 'undefined')
            localStorage.setItem('app-theme-mode', mode);
          setThemeMode(mode);
        }}
      >
        <Routes>
          <Route
            path="/"
            element={
              app!.layout?.component ? (
                (() => {
                  const LayoutWrap = app!.layout.component;
                  return (
                    <LayoutWrap>
                      <Outlet />
                    </LayoutWrap>
                  );
                })()
              ) : (
                <Outlet />
              )
            }
          >
            <Route
              index
              element={
                <Navigate
                  to={
                    app!.defaultPageId
                      ? `/${app!.defaultPageId}`
                      : `/${app!.pages[0]!.id}`
                  }
                  replace
                />
              }
            />
            {app!.pages.map((p) => {
              const raw = p.component;
              const Comp =
                raw &&
                typeof raw === 'object' &&
                'component' in raw &&
                typeof (raw as { component: ComponentType<any> }).component ===
                  'function'
                  ? (raw as { component: ComponentType<any> }).component
                  : (raw as ComponentType<any>);
              return (
                <Route
                  key={p.id}
                  path={`/${p.id}`}
                  element={Comp ? <Comp /> : null}
                />
              );
            })}
            {/* Same as SaaS: allow navigation by page name (e.g. /dashboard) not just id */}
            {app!.pages.map((p) => {
              if (p.name === p.id) return null;
              const raw = p.component;
              const Comp =
                raw &&
                typeof raw === 'object' &&
                'component' in raw &&
                typeof (raw as { component: ComponentType<any> }).component ===
                  'function'
                  ? (raw as { component: ComponentType<any> }).component
                  : (raw as ComponentType<any>);
              return (
                <Route
                  key={`name-${p.name}`}
                  path={`/${p.name}`}
                  element={Comp ? <Comp /> : null}
                />
              );
            })}
          </Route>
        </Routes>
      </ClientProvider>
    );
  };

  let client: ReactClientSdk | null = null;

  function AuthenticatedApp() {
    const [token, setTokenState] = useState<string | null>(() => getToken());
    const [clientReady, setClientReady] = useState(false);

    useEffect(() => {
      const t = getToken();
      setTokenState(t);
      if (!t) return;
      const c = new ReactClientSdk({ appId: appId!, token: t });
      client = c;
      c.authenticate().then(() => setClientReady(true));
    }, []);

    if (!token) {
      return <Navigate to="/auth/login" replace />;
    }
    if (!clientReady || !client) {
      return (
        <div
          style={{
            padding: '2rem',
            fontFamily: 'system-ui',
            textAlign: 'center',
          }}
        >
          Loading…
        </div>
      );
    }
    return <StandaloneApp />;
  }

  createRoot(rootEl).render(
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/magic-login" element={<Login />} />
          <Route path="/auth/app-login" element={<Login />} />
          <Route path="*" element={<AuthenticatedApp />} />
        </Routes>
      </BrowserRouter>
    </StrictMode>,
  );
}
