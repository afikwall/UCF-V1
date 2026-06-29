# Table Artifacts

> Part of the [`app-artifacts`](../SKILL.md) skill. Read this before creating/updating/deleting a table.

Define the app's data model as JSON files under `artifacts/tables/<Name>.json` (one file per table). On sync these become real table blocks. After writing/changing table artifacts, run **`pnpm gen:types`**.

## File location

`artifacts/tables/<Name>.json` — e.g. `Tasks.json`, `Orders.json`.

## JSON schema (one file = one table)

```json
{
  "type": "object",
  "required": ["name", "columns"],
  "properties": {
    "name": {
      "type": "string",
      "description": "Table name (globally unique within the app)"
    },
    "description": {
      "type": "string",
      "description": "User-friendly description, short and concise"
    },
    "technicalDescription": {
      "type": "string",
      "description": "Explains intent, meaning, and how the data is used — not just the name"
    },
    "iconName": {
      "type": "string",
      "description": "Lucide icon name (e.g. table, users, package)"
    },
    "displayColumn": {
      "type": "string",
      "description": "Primary human-readable column used as the row label in dropdowns/reference fields (e.g. name, title, email)"
    },
    "uniqueKey": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Column names forming a unique identifier; enables upsert. Each must exist in columns."
    },
    "defaultUpsert": {
      "type": "boolean",
      "description": "When true, inserts update existing rows on unique-key match instead of failing. Requires uniqueKey."
    },
    "seedData": {
      "type": "array",
      "description": "Optional demo/seed rows inserted after the table block is created on sync. Reference columns use placeholder row ids 1, 2, 3, … (first row = 1); sync remaps to real ids.",
      "items": {
        "type": "object",
        "additionalProperties": true
      }
    },
    "permission": {
      "type": "object",
      "properties": {
        "type": { "enum": ["private", "public", "publicRead", "publicWrite"] }
      }
    },
    "columns": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "type", "description"],
        "properties": {
          "name": {
            "type": "string",
            "description": "Column name (camelCase)"
          },
          "type": {
            "enum": [
              "string",
              "number",
              "boolean",
              "object",
              "date",
              "time",
              "datetime"
            ]
          },
          "description": {
            "type": "string",
            "description": "Explains intent/meaning/use"
          },
          "enum": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Allowed values for a string column"
          },
          "expression": {
            "type": "string",
            "description": "Computed column JS expression; receives `item` (current row), e.g. item.first + ' ' + item.last"
          },
          "schema": {
            "type": "object",
            "description": "JSON Schema for an object column (mandatory when type is object)"
          },
          "reference": {
            "type": "object",
            "required": ["table", "column", "relationshipHint"],
            "properties": {
              "table": {
                "type": "string",
                "description": "Referenced table name"
              },
              "column": {
                "type": "string",
                "description": "Referenced column (typically id)"
              },
              "relationshipHint": { "enum": ["manyToOne", "oneToOne"] }
            }
          }
        }
      }
    }
  }
}
```

## Rules

- **Scope:** create only entities that will have CRUD in the app UI; for constant/known option lists, hardcode in page code instead of a table. Prefer ≤ 3–4 entities unless the user clearly needs more.
- **Column names:** unique within a table and **case-sensitive**; camelCase.
- **Reserved column names (never use, in any case/variant):** id, userId, accountId, appId, tableId, createdAt, createdBy, updatedAt, updatedBy, updatedByAgentId, deletedAt, deletedBy, isDeleted, metadata, tenantId. They are added automatically.
- **Object columns:** when `type` is `object`, provide a **fully detailed** `schema` where every nested object and array item has its properties explicitly defined. `additionalProperties: true` without properties is only acceptable for genuinely dynamic structures. When storing an action's output in an object column, mirror that action's output schema (DescribeActions).
- **Calendar/scheduling:** use single `startDateTime`, `endDateTime` (datetime) columns (NOT separate date + time), optionally `isAllDay` (boolean).
- **Relationships:** use a column with `reference` (foreign key) instead of duplicating data.

## Seed / demo data (`seedData`)

Optional `seedData` array on a table artifact. Rows are inserted **once**, when the table block is **first created** on sync (not on schema updates).

- Do **not** include reserved/platform columns (`id`, `createdAt`, …) — they are assigned automatically.
- For **reference columns**, use placeholder row ids `1`, `2`, `3`, … matching the **order** of rows in the referenced table's `seedData` (first row = `1`, second = `2`, …). Sync remaps placeholders to real row ids after parent tables are seeded.
- Parent tables with `seedData` must be created in the same sync batch before dependents (define `reference` on columns — create order follows dependencies).

Example:

```json
{
  "name": "Categories",
  "displayColumn": "name",
  "columns": [
    { "name": "name", "type": "string", "description": "Category name" }
  ],
  "seedData": [{ "name": "Electronics" }, { "name": "Books" }]
}
```

```json
{
  "name": "Products",
  "displayColumn": "name",
  "columns": [
    { "name": "name", "type": "string", "description": "Product name" },
    {
      "name": "categoryId",
      "type": "number",
      "description": "Category",
      "reference": {
        "table": "Categories",
        "column": "id",
        "relationshipHint": "manyToOne"
      }
    }
  ],
  "seedData": [
    { "name": "Widget", "categoryId": 1 },
    { "name": "Novel", "categoryId": 2 }
  ]
}
```

## Users, roles, and extension entities (critical)

- **Do not create a users table** — the platform provides `UsersEntity` (id, email, name, role). Users are created/managed outside the app (auth); the app only references existing users. Don't build auth infrastructure (the frontend uses `useGoogleLogin()` / `useSendLoginLink()` / `logOut()`).
- **Roles are server-controlled.** Never create boolean role columns (`isTeacher`, `isAdmin`, …) or a column/table to store/change user roles. Use only the `role` field from UsersEntity. (Role assignment/management features only if the user explicitly asks.)
- **Role-specific data → separate profile entities**, not flags: e.g. `TeacherProfile` (subjects, qualifications), `StudentProfile` (grade). Not `UserProfile` with `isTeacher: boolean`.
- **Extending user data — use `email` as the foreign key, never `userId`:** extension entities (`UserProfile`, `SellerProfile`, …) have an `email` column referencing UsersEntity. Core user data (email, name, role) stays in UsersEntity; app-specific data goes in extension entities.
- **Two-tier reference pattern:** user-extension entities reference UsersEntity by `email`; all OTHER entities reference the extension entity's `id` (e.g. `ShiftsEntity.doctorId` → `DoctorProfile.id`). Chain: `UsersEntity.email → DoctorProfile.email → DoctorProfile.id → ShiftsEntity.doctorId`.
- **Extension records may not exist yet** (first-time users). Design for graceful handling: **lazy creation** (create on first save — preferred for optional data) or **auto-creation** (on first access — only when essential).

## Update & delete

- **Update:** write the artifact with the **same name** as an existing table → it is updated in place (editTables). Columns are diffed against the live table: new columns are **added**, existing columns are **updated** (description, enum, expression, schema, reference), and columns no longer present are **removed** (system/reserved columns are never removed). Table metadata (description, icon, displayColumn, uniqueKey) is patched too. A column's **type is preserved** on update — to change a column's type, remove it and add a new column with the new type (this drops the old column's data).
- **Delete:** remove the artifact file from `artifacts/tables/` to delete the table on sync.

After any table change, run **`pnpm gen:types`**, then build the UI.
