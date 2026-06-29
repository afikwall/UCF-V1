/**
 * AUTO-GENERATED — do not edit by hand.
 * Bundled from apps/compiler/src/modules/code-gen via apps/compiler/scripts/bundle-gen-types.mjs
 * Regenerate: pnpm --filter @blockscom/compiler run bundle:gen-types
 */

// src/modules/code-gen/schema-based-types-generator.ts
var SchemaBasedTypesGenerator = class _SchemaBasedTypesGenerator {
  constructor(options) {
    this.generatedTypes = /* @__PURE__ */ new Map();
    this.visitedRefs = /* @__PURE__ */ new Set();
    this.options = options;
    this.mainTypeName = "";
  }
  static convert(schema, options = { skipReadOnlyProps: false }) {
    return new _SchemaBasedTypesGenerator(options).convertSchema(schema);
  }
  static formatTypeName(name) {
    return new _SchemaBasedTypesGenerator({}).formatTypeName(name);
  }
  convertSchema(schema) {
    this.visitedRefs = /* @__PURE__ */ new Set();
    this.generatedTypes.clear();
    if (schema.definitions) {
      for (const [name, definition] of Object.entries(schema.definitions)) {
        this.processDefinition(name, definition);
      }
    }
    const mainTypeName = schema.title || "Root";
    this.mainTypeName = this.formatTypeName(mainTypeName);
    this.processType(this.mainTypeName, schema);
    let output = "";
    for (const [, code] of this.generatedTypes) {
      output += `${code}

`;
    }
    return output;
  }
  processDefinition(name, definition) {
    if (typeof definition === "boolean" || Array.isArray(definition)) {
      return;
    }
    this.processType(name, definition);
  }
  processType(name, schema) {
    if (schema.$ref) {
      const refName = this.getRefName(schema.$ref);
      if (!this.visitedRefs.has(refName)) {
        this.visitedRefs.add(refName);
      }
      return;
    }
    if (schema.type === "null") {
      return;
    }
    const typeName = this.formatTypeName(name);
    if (schema.type === "object" || schema.properties !== void 0 && Object.keys(schema.properties).length > 0) {
      this.processObjectType(typeName, schema);
    } else if (schema.type === "array" && schema.items) {
      this.processArrayType(typeName, schema);
    } else if (schema.enum && schema.enum.length > 0) {
      this.processEnumType(typeName, schema);
    } else if (schema.oneOf || schema.anyOf || schema.allOf) {
      this.processCompositeType(typeName, schema);
    } else {
      this.generateSimpleType(typeName, schema);
    }
  }
  processObjectType(name, schema) {
    if (this.generatedTypes.has(name)) {
      return;
    }
    let typeCode = `
/**
* ${schema.description}
*/
export interface I${name} {
`;
    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (typeof propSchema === "boolean" || Array.isArray(propSchema)) {
          continue;
        }
        if (propSchema.readOnly && this.options.skipReadOnlyProps) {
          continue;
        }
        const propType = this.getTypeForProperty(propName, propSchema);
        if (propType === "null") {
          continue;
        }
        const isRequired = schema.required?.includes(propName) ?? false;
        const optionalMark = isRequired ? "" : "?";
        const textPropName = propName || propSchema.title;
        if (textPropName?.includes(".")) {
          this.options.onWarn?.(
            `Property name ${textPropName} contains a dot, which is not allowed. skipping...`
          );
          continue;
        }
        let propDefault;
        if (propSchema.default) {
          if (typeof propSchema.default === "string") {
            propDefault = `(default: "${propSchema.default}")`;
          } else {
            propDefault = `(default: ${propSchema.default})`;
          }
        }
        if (propSchema.description || propDefault) {
          typeCode += `  /** ${propSchema.description || ""} ${propDefault || ""} */
`;
        }
        if (textPropName?.startsWith("@")) {
          typeCode += `  "${textPropName}"${optionalMark}: ${propType};
`;
        } else {
          typeCode += `  ${textPropName}${optionalMark}: ${propType};
`;
        }
      }
    }
    typeCode += "}\n";
    this.generatedTypes.set(name, typeCode);
  }
  processArrayType(name, schema) {
    if (this.generatedTypes.has(name)) {
      return;
    }
    const itemsSchema = schema.items;
    if (!itemsSchema || typeof itemsSchema === "boolean" || Array.isArray(itemsSchema)) {
      return;
    }
    const itemType = this.getTypeForProperty(`${name}Item`, itemsSchema);
    const typeCode = `export type ${name} = ${itemType}[];`;
    this.generatedTypes.set(name, typeCode);
  }
  processEnumType(name, schema) {
    if (this.generatedTypes.has(name) || !schema.enum?.length) {
      return;
    }
    let typeCode;
    if (schema.enum.every((item) => typeof item === "string")) {
      typeCode = `export type ${name} = ${schema.enum.map((value) => `"${value}"`).join(" | ")};`;
    } else {
      const unionValues = schema.enum.map((value) => {
        if (typeof value === "string") {
          return `'${value}'`;
        }
        if (value === null) {
          return "null";
        }
        return String(value);
      }).join(" | ");
      typeCode = `export type ${name} = ${unionValues};`;
    }
    this.generatedTypes.set(name, typeCode);
  }
  processCompositeType(name, schema) {
    if (this.generatedTypes.has(name)) {
      return;
    }
    let compositeSchema;
    let operator = "|";
    if (schema.oneOf) {
      compositeSchema = schema.oneOf.filter(
        (s) => typeof s !== "boolean" && !Array.isArray(s)
      );
    } else if (schema.anyOf) {
      compositeSchema = schema.anyOf.filter(
        (s) => typeof s !== "boolean" && !Array.isArray(s)
      );
    } else if (schema.allOf) {
      compositeSchema = schema.allOf.filter(
        (s) => typeof s !== "boolean" && !Array.isArray(s)
      );
      operator = "&";
    } else {
      return;
    }
    const typeNames = [];
    for (let i = 0; i < compositeSchema.length; i++) {
      const subSchema = compositeSchema[i];
      const subName = `${name}Item${i + 1}`;
      if (subSchema.$ref) {
        typeNames.push(this.getRefName(subSchema.$ref));
      } else {
        this.processType(subName, subSchema);
        typeNames.push(subName);
      }
    }
    const typeCode = `export type ${name} = ${typeNames.join(` ${operator} `)};`;
    this.generatedTypes.set(name, typeCode);
  }
  generateSimpleType(name, schema) {
    if (this.generatedTypes.has(name)) {
      return;
    }
    let tsType;
    switch (schema.type) {
      case "string":
        tsType = "string";
        break;
      case "integer":
      case "number":
        tsType = "number";
        break;
      case "boolean":
        tsType = "boolean";
        break;
      case "null":
        tsType = "null";
        break;
      default:
        tsType = "any";
    }
    this.generatedTypes.set(name, `export type ${name} = ${tsType};`);
  }
  getTypeForProperty(name, schema) {
    if (!schema) {
      return "any";
    }
    if (schema.$ref) {
      return this.getRefName(schema.$ref);
    }
    if (name !== this.mainTypeName) {
      name = `${this.mainTypeName}${this.formatTypeName(name)}`;
    }
    if (schema.oneOf) {
      return schema.oneOf.filter(
        (s) => typeof s !== "boolean" && !Array.isArray(s)
      ).map((v) => this.getTypeForProperty(`${name}Item`, v)).join(" | ");
    }
    if (schema.anyOf) {
      return schema.anyOf.filter(
        (s) => typeof s !== "boolean" && !Array.isArray(s)
      ).map((v) => this.getTypeForProperty(`${name}Item`, v)).join(" | ");
    }
    if (schema.allOf) {
      return schema.allOf.filter(
        (s) => typeof s !== "boolean" && !Array.isArray(s)
      ).map((v) => this.getTypeForProperty(`${name}Item`, v)).join(" & ");
    }
    if (schema.enum?.length) {
      const subName = this.formatTypeName(`${name}Enum`);
      this.processEnumType(subName, schema);
      return subName;
    }
    if (schema.type === "array") {
      if (schema.items && typeof schema.items !== "boolean" && !Array.isArray(schema.items)) {
        return `${this.getTypeForProperty(`${name}Item`, schema.items)}[]`;
      }
      return "any[]";
    }
    if (schema.type === "object") {
      const subName = this.formatTypeName(`${name}Object`);
      this.processObjectType(subName, schema);
      return `I${subName}`;
    }
    switch (schema.type) {
      case "string":
        return "string";
      case "integer":
      case "number":
        return "number";
      case "boolean":
        return "boolean";
      case "null":
        return "null";
      default:
        return "any";
    }
  }
  getRefName(ref) {
    const parts = ref.split("/");
    return this.formatTypeName(parts[parts.length - 1]);
  }
  formatTypeName(name) {
    return name.replace(/[^\w\s-]/g, "").split(/[-\s]+/).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
  }
};

// src/modules/code-gen/artifact-to-describe-core.ts
import fs from "fs/promises";
import path from "path";

// src/modules/code-gen/codegen-constants.ts
var ARTIFACTS_DIR_NAME = "artifacts";
var ARTIFACT_SUBDIRS = {
  tables: "tables",
  actions: "actions",
  workflows: "workflows",
  views: "views",
  roles: "roles",
  agents: "agents",
  agentChats: "agent-chats"
};
var APP_FILENAME = "app.json";
var SRC_DIR_NAME = "src";
var PAGES_DIR_NAME = "pages";
var PAGE_FILE_EXTENSION = ".tsx";
var ARTIFACT_PLACEHOLDER_PREFIX = "artifact:";
var PAGE_CONST_PATTERN = /export const (\w+Page)\s*=\s*(?:\{[\s\S]*?\}\s*as const|"[^"]*");/g;

// src/modules/code-gen/artifact-to-describe-core.ts
function artifactActionPlaceholderId(name) {
  return `${ARTIFACT_PLACEHOLDER_PREFIX}action:${name.replace(/\s+/g, "")}`;
}
function columnTypeToJsonSchema(col) {
  const desc = col.description ?? "";
  const base = { description: desc };
  switch (col.type) {
    case "string": {
      const enumValues = col.enum ?? [];
      return {
        type: "string",
        enum: enumValues.length ? enumValues : void 0,
        ...base
      };
    }
    case "number":
      return { type: "number", ...base };
    case "boolean":
      return { type: "boolean", ...base };
    case "date":
    case "time":
    case "datetime":
      return { type: "string", format: "date-time", ...base };
    case "object":
      return col.schema ? { ...col.schema, ...base } : { type: "object", additionalProperties: true, ...base };
    default:
      return { type: "string", ...base };
  }
}
function artifactTableToTableDescribe(table) {
  const title = table.name.replace(/\s+/g, "");
  const properties = {};
  for (const col of table.columns) {
    properties[col.name] = columnTypeToJsonSchema(col);
  }
  return {
    schema: {
      $id: `${ARTIFACT_PLACEHOLDER_PREFIX}table:${title}`,
      title,
      description: table.description,
      type: "object",
      properties
    }
  };
}
function resolveActionInputSchema(action) {
  if (action.inputSchema) {
    return action.inputSchema;
  }
  return { type: "object", properties: {} };
}
function resolveActionOutputSchema(action) {
  if (action.type === "code" && action.outputSchema) {
    return action.outputSchema;
  }
  if (action.output && typeof action.output === "object" && "type" in action.output) {
    return action.output;
  }
  return { type: "object", properties: {} };
}
function artifactActionToActionDescribe(action) {
  const name = action.name.replace(/\s+/g, "");
  const entry = {
    actionTypeId: artifactActionPlaceholderId(action.name),
    actionTypeName: name,
    actionTypeDescription: action.description ?? name,
    actionSetId: "app",
    isCurrentAppAction: true,
    input: resolveActionInputSchema(action),
    output: resolveActionOutputSchema(action)
  };
  if (action.type === "dag") {
    entry.actionNodes = action.actionNodes ?? [];
    entry.conditionNodes = action.conditionNodes;
    entry.mergeNodes = action.mergeNodes;
    entry.edges = action.edges;
    if (typeof action.output === "string") {
      entry.outputNode = action.output;
    }
  }
  return entry;
}
function artifactViewToViewDescribe(view) {
  const title = view.name.replace(/\s+/g, "");
  const properties = {};
  for (const col of view.calculatedColumns) {
    properties[col.name] = col.type === "string" ? { type: "string", description: col.description } : col.type === "number" ? { type: "number", description: col.description } : col.type === "boolean" ? { type: "boolean", description: col.description } : col.type === "date" || col.type === "time" || col.type === "datetime" ? {
      type: "string",
      format: "date-time",
      description: col.description
    } : { type: "string", description: col.description };
  }
  return {
    schema: {
      $id: `${ARTIFACT_PLACEHOLDER_PREFIX}view:${title}`,
      title,
      type: "object",
      properties
    }
  };
}
function normalizeAgentRef(value) {
  return value.replace(/\s+/g, "").toLowerCase();
}
function artifactAgentPlaceholderId(key) {
  return `${ARTIFACT_PLACEHOLDER_PREFIX}agent:${key}`;
}
function artifactAgentChatPlaceholderId(key) {
  return `${ARTIFACT_PLACEHOLDER_PREFIX}agentChat:${key}`;
}
function artifactAgentToAgentDescribe(key, agent) {
  return {
    agentId: artifactAgentPlaceholderId(key),
    agentName: agent.name,
    jobTitle: agent.jobTitle ?? "",
    harness: "deep_agent",
    instructions: agent.instructions ?? "",
    memoryEnabled: agent.memoryEnabled,
    tools: (agent.tools ?? []).map((tool) => ({
      actionTypeId: tool.actionTypeId
    }))
  };
}
function resolveAgentIdForArtifactChat(chat, manifest) {
  const agents = manifest.agents ?? {};
  if (chat.agentId) {
    if (chat.agentId.startsWith(ARTIFACT_PLACEHOLDER_PREFIX)) {
      return chat.agentId;
    }
    if (agents[chat.agentId]) {
      return artifactAgentPlaceholderId(chat.agentId);
    }
    const byName = Object.entries(agents).find(
      ([, agent]) => normalizeAgentRef(agent.name) === normalizeAgentRef(chat.agentId)
    );
    if (byName) {
      return artifactAgentPlaceholderId(byName[0]);
    }
    return chat.agentId;
  }
  const entries = Object.entries(agents);
  if (entries.length === 1) {
    return artifactAgentPlaceholderId(entries[0][0]);
  }
  return void 0;
}
function artifactAgentChatToAgentChatDescribe(key, chat, manifest) {
  return {
    agentChatId: artifactAgentChatPlaceholderId(key),
    agentChatName: chat.name,
    agentId: resolveAgentIdForArtifactChat(chat, manifest)
  };
}
function buildDescribeFromArtifacts(manifest) {
  const tables = {};
  for (const [key, table] of Object.entries(manifest.tables ?? {})) {
    tables[key] = artifactTableToTableDescribe(table);
  }
  const views = {};
  for (const [key, view] of Object.entries(manifest.views ?? {})) {
    views[key] = artifactViewToViewDescribe(view);
  }
  const actions = {};
  for (const [key, action] of Object.entries(manifest.actions ?? {})) {
    actions[key] = artifactActionToActionDescribe(action);
  }
  const agents = {};
  for (const [key, agent] of Object.entries(manifest.agents ?? {})) {
    agents[key] = artifactAgentToAgentDescribe(key, agent);
  }
  const agentChats = {};
  for (const [key, chat] of Object.entries(manifest.agentChats ?? {})) {
    agentChats[key] = artifactAgentChatToAgentChatDescribe(key, chat, manifest);
  }
  return { tables, views, actions, agents, agentChats };
}
async function readPagesFromDirectory(projectRoot) {
  const pagesDir = path.join(projectRoot, SRC_DIR_NAME, PAGES_DIR_NAME);
  const walk = async (dir) => {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return [];
    }
    const files2 = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files2.push(...await walk(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(PAGE_FILE_EXTENSION)) {
        files2.push(fullPath);
      }
    }
    return files2;
  };
  const files = (await walk(pagesDir)).sort();
  const pages = {};
  for (const file of files) {
    const relFromPages = path.relative(pagesDir, file).split(path.sep).join("/").replace(/\.tsx$/, "");
    pages[relFromPages] = { id: relFromPages, name: relFromPages };
  }
  return pages;
}
async function readArtifactsFromDirectory(compilerDir) {
  const artifactsDir = path.join(compilerDir, ARTIFACTS_DIR_NAME);
  const manifest = {};
  try {
    await fs.access(artifactsDir);
  } catch {
    return manifest;
  }
  const readJsonDir = async (subdir) => {
    const dir = path.join(artifactsDir, subdir);
    try {
      await fs.access(dir);
    } catch {
      return {};
    }
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const out = {};
    for (const e of entries) {
      if (!e.isFile() || !e.name.endsWith(".json")) {
        continue;
      }
      const key = e.name.slice(0, -5);
      const content = await fs.readFile(path.join(dir, e.name), "utf-8");
      try {
        out[key] = JSON.parse(content);
      } catch (err) {
        console.warn(
          `Skipping invalid artifact JSON in ${subdir}/${e.name}: ${err.message}`
        );
      }
    }
    return out;
  };
  manifest.tables = await readJsonDir(ARTIFACT_SUBDIRS.tables);
  manifest.actions = await readJsonDir(
    ARTIFACT_SUBDIRS.actions
  );
  manifest.workflows = await readJsonDir(ARTIFACT_SUBDIRS.workflows);
  manifest.views = await readJsonDir(ARTIFACT_SUBDIRS.views);
  manifest.roles = await readJsonDir(ARTIFACT_SUBDIRS.roles);
  manifest.agents = await readJsonDir(ARTIFACT_SUBDIRS.agents);
  manifest.agentChats = await readJsonDir(
    ARTIFACT_SUBDIRS.agentChats
  );
  const appPath = path.join(artifactsDir, APP_FILENAME);
  try {
    manifest.app = JSON.parse(await fs.readFile(appPath, "utf-8"));
  } catch {
  }
  return manifest;
}

// src/modules/code-gen/generate-product-types.ts
import fs2 from "fs/promises";
import path2 from "path";
function extractPageConstBlocks(source) {
  if (!source) {
    return [];
  }
  const blocks = [];
  const pattern = new RegExp(PAGE_CONST_PATTERN.source, "g");
  let match;
  while ((match = pattern.exec(source)) !== null) {
    blocks.push(match[0]);
  }
  return blocks;
}
function generateCodeFromDescribe(appDescribe, options = {}) {
  const types = [];
  const tableDescribes = Object.values(appDescribe.tables || {});
  const viewDescribes = Object.values(appDescribe.views || {});
  const schemas = [...tableDescribes, ...viewDescribes].map(
    (describe) => describe.schema
  );
  for (const tableDescribe of schemas) {
    if (!tableDescribe.title) {
      continue;
    }
    const tableBlockId = options.isAppBuilderFullAgentSdk ? tableDescribe.title : tableDescribe.$id;
    tableDescribe.title = `${tableDescribe.title}Entity`;
    let code = SchemaBasedTypesGenerator.convert(tableDescribe, {
      skipReadOnlyProps: true
    });
    const instanceTypeName = SchemaBasedTypesGenerator.formatTypeName(
      tableDescribe.title
    );
    code += `
export const ${instanceTypeName} = {
    tableBlockId: "${tableBlockId}",
    instanceType: {} as I${instanceTypeName}
} as const;
`;
    types.push(code);
  }
  if (options.pageConstBlocks?.length) {
    for (const pageConst of options.pageConstBlocks) {
      types.push(`
${pageConst}
`);
    }
  } else {
    const codePageDescribes = Object.entries(appDescribe.pages || {});
    for (const [key, codePageDescribe] of codePageDescribes) {
      const pageConstName = SchemaBasedTypesGenerator.formatTypeName(
        `${key}Page`
      );
      if (options.isAppBuilderFullAgentSdk) {
        types.push(`export const ${pageConstName} = ${JSON.stringify(key)};
`);
      } else {
        const pageBlockId = codePageDescribe.id;
        codePageDescribe.name = `${key}Page`;
        types.push(`
export const ${pageConstName} = {
  pageBlockId: "${pageBlockId}",
  pageName: "${key}",
} as const;
`);
      }
    }
  }
  const actionsDescribes = Object.values(appDescribe.actions || {});
  for (const actionDescribe of actionsDescribes) {
    if (!actionDescribe.actionTypeName) {
      continue;
    }
    const actionTypeName = actionDescribe.actionTypeName;
    actionDescribe.actionTypeName = `${actionDescribe.actionTypeName}Action`;
    const wfInputDesc = actionDescribe.input || {
      type: "object",
      properties: {}
    };
    const wfOutputDesc = actionDescribe.output || {
      type: "object",
      properties: {}
    };
    wfInputDesc.title = `${actionDescribe.actionTypeName}Input`;
    types.push(SchemaBasedTypesGenerator.convert(wfInputDesc));
    wfOutputDesc.title = `${actionDescribe.actionTypeName}Output`;
    types.push(SchemaBasedTypesGenerator.convert(wfOutputDesc));
    let outputType = `I${SchemaBasedTypesGenerator.formatTypeName(wfOutputDesc.title)}`;
    if (wfOutputDesc.type == "object" && (!wfOutputDesc.properties || Object.keys(wfOutputDesc.properties).length == 0)) {
      outputType = "any";
    }
    const actionBlockId = options.isAppBuilderFullAgentSdk ? actionTypeName.replace(/\s+/g, "") : actionDescribe.actionTypeId;
    const toolSetId = actionDescribe.actionTypeId.split("&")[1] || void 0;
    const toolId = actionDescribe.actionTypeId.split("&")[2] || void 0;
    types.push(`
/**
* ${actionDescribe.actionTypeName}
* ${actionDescribe.actionTypeDescription}
*/
export const ${SchemaBasedTypesGenerator.formatTypeName(actionDescribe.actionTypeName)} = {
  actionBlockId: "${actionBlockId}",
  ${toolSetId ? `toolSetId: "${toolSetId}",` : ""}
  ${toolId ? `toolId: "${toolId}",` : ""}
  inputInstanceType: {} as I${SchemaBasedTypesGenerator.formatTypeName(wfInputDesc.title)},
  outputInstanceType: {} as ${outputType},
} as const;
`);
  }
  const agentDescribes = Object.entries(appDescribe.agents || {});
  const agentIdsToAgentDescribes = /* @__PURE__ */ new Map();
  for (const [key, agentDescribe] of agentDescribes) {
    agentIdsToAgentDescribes.set(agentDescribe.agentId, agentDescribe);
    const title = `${key}Agent`;
    const agentBlockId = options.isAppBuilderFullAgentSdk ? agentDescribe.agentName : agentDescribe.agentId;
    const agentConstName = SchemaBasedTypesGenerator.formatTypeName(title);
    types.push(`
export const ${agentConstName} = {
        id: "${agentBlockId}",
        name: ${JSON.stringify(agentDescribe.agentName)},
        title: ${JSON.stringify(agentDescribe.jobTitle)},
        harness: ${agentDescribe.harness ? `"${agentDescribe.harness}"` : "undefined"},
        photoUrl: ${agentDescribe.photoUrl ? JSON.stringify(agentDescribe.photoUrl) : "undefined"},
        avatarUrl: ${agentDescribe.avatarUrl ? JSON.stringify(agentDescribe.avatarUrl) : "undefined"},
      } as const;
`);
  }
  const agentChatDescribes = Object.entries(appDescribe.agentChats || {});
  const componentIds = Object.values(appDescribe.chatComponents || {}).map(
    (component) => component.chatComponentId
  );
  for (const [key, agentChatDescribe] of agentChatDescribes) {
    if (!agentChatDescribe.agentId) {
      continue;
    }
    const agentHarness = agentIdsToAgentDescribes.get(
      agentChatDescribe.agentId
    )?.harness;
    const agentName = Object.values(appDescribe.agents || {}).find(
      (agent) => agent.agentName === agentChatDescribe.agentId || agent.agentId === agentChatDescribe.agentId
    )?.agentName;
    const title = `${key}AgentChat`;
    const agentChatBlockId = options.isAppBuilderFullAgentSdk ? agentChatDescribe.agentChatName : agentChatDescribe.agentChatId;
    const agentBlockId = options.isAppBuilderFullAgentSdk ? agentName : agentChatDescribe.agentId;
    types.push(`
export const ${SchemaBasedTypesGenerator.formatTypeName(title)} = {
        agentChatId: "${agentChatBlockId}",
        agentId: ${agentBlockId ? `"${agentBlockId}"` : "undefined"},
        agentHarness: ${agentHarness ? `"${agentHarness}"` : "undefined"},
        componentIds: ${JSON.stringify(componentIds)},
      } as const;
`);
  }
  const allCode = types.join("\n");
  return allCode.replace(
    /(\s*)([0-9][a-zA-Z0-9]*[x×][0-9]+)(\s*):/g,
    '$1"$2"$3:'
  );
}
async function generateProductTypes(projectRoot, options = {}) {
  const productTypesPath = options.productTypesPath ?? path2.join(projectRoot, "src", "product-types.ts");
  const pages = await readPagesFromDirectory(projectRoot);
  const hasPagesFromDisk = Object.keys(pages).length > 0;
  let pageConstBlocks = [];
  if (!hasPagesFromDisk && !options.skipPagePreservation) {
    try {
      const existing = await fs2.readFile(productTypesPath, "utf-8");
      pageConstBlocks = extractPageConstBlocks(existing);
    } catch {
    }
  }
  const manifest = await readArtifactsFromDirectory(projectRoot);
  const describe = buildDescribeFromArtifacts(manifest);
  describe.pages = pages;
  const code = generateCodeFromDescribe(describe, {
    pageConstBlocks,
    isAppBuilderFullAgentSdk: true
  });
  if (options.write !== false) {
    await fs2.mkdir(path2.dirname(productTypesPath), { recursive: true });
    await fs2.writeFile(productTypesPath, code, "utf-8");
  }
  return {
    code,
    manifest,
    describe,
    pageConstBlocks,
    counts: {
      tables: Object.keys(describe.tables ?? {}).length,
      views: Object.keys(describe.views ?? {}).length,
      actions: Object.keys(describe.actions ?? {}).length,
      agents: Object.keys(describe.agents ?? {}).length,
      agentChats: Object.keys(describe.agentChats ?? {}).length,
      pages: hasPagesFromDisk ? Object.keys(pages).length : pageConstBlocks.length
    }
  };
}

// src/modules/code-gen/cli.ts
import path3 from "path";
import { fileURLToPath, pathToFileURL } from "url";
async function runCli(projectRoot) {
  const { counts } = await generateProductTypes(projectRoot);
  console.log(
    `Regenerated src/product-types.ts (tables: ${counts.tables}, views: ${counts.views}, actions: ${counts.actions}, agents: ${counts.agents}, agentChats: ${counts.agentChats}, pages: ${counts.pages}).`
  );
}
var isMain = process.argv[1] && pathToFileURL(path3.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const projectRoot = process.argv[2] ? path3.resolve(process.argv[2]) : path3.join(path3.dirname(fileURLToPath(import.meta.url)), "..");
  runCli(projectRoot).catch((error) => {
    console.error(
      `Error generating product-types: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  });
}
export {
  ARTIFACTS_DIR_NAME,
  ARTIFACT_PLACEHOLDER_PREFIX,
  ARTIFACT_SUBDIRS,
  SchemaBasedTypesGenerator,
  artifactTableToTableDescribe,
  artifactViewToViewDescribe,
  buildDescribeFromArtifacts,
  extractPageConstBlocks,
  generateCodeFromDescribe,
  generateProductTypes,
  readArtifactsFromDirectory,
  readPagesFromDirectory,
  runCli
};
