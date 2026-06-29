# View Artifacts

> Part of the [`app-artifacts`](../SKILL.md) skill. Read this before creating/deleting a view.

Views are read-only derived datasets — aggregations, joins, filtered subsets, computed columns. Use a view for those; use a table for plain single-table CRUD. Define each view as `artifacts/views/<Name>.json`. After changes, run **`pnpm gen:types`**.

## Entity exports in `product-types.ts`

View artifacts use the **same naming as tables** in generated types:

| View artifact `name` | Import in frontend                                  |
| -------------------- | --------------------------------------------------- |
| `LowStockProducts`   | `LowStockProductsEntity`, `ILowStockProductsEntity` |
| `OrdersOverview`     | `OrdersOverviewEntity`, `IOrdersOverviewEntity`     |

The frontend imports these from `@/product-types` and reads them with **`useEntityGetAll` / `useEntityGetOne` only** — views cannot be created, updated, or deleted from the UI.

**Do not** put derived/joined/aggregated data in a table artifact just to get an entity export. If the UI needs a dashboard list, KPI rollup, or multi-table join, create a **view** artifact first, run **`pnpm gen:types`**, then build the UI.

## When to create a view (not a table)

Create `artifacts/views/<Name>.json` when the UI needs:

- Joins across tables (e.g. order + customer name on one row)
- Aggregations (counts, sums, averages)
- Filtered subsets (e.g. low-stock products, open orders)
- Computed columns on top of a base query

Create `artifacts/tables/<Name>.json` only for plain single-table CRUD storage.

## File location

`artifacts/views/<Name>.json` — e.g. `OrderSummary.json`.

## JSON schema

```json
{
  "type": "object",
  "required": ["name", "query", "calculatedColumns"],
  "properties": {
    "name": { "type": "string", "description": "View name" },
    "description": {
      "type": "string",
      "description": "User-friendly description, short and concise"
    },
    "technicalDescription": {
      "type": "string",
      "description": "Intent, meaning, dependencies, and how data is used"
    },
    "permission": {
      "type": "object",
      "properties": {
        "type": { "enum": ["private", "public", "publicRead", "publicWrite"] }
      }
    },
    "query": {
      "type": "object",
      "description": "Source query for the view",
      "properties": {
        "from": {
          "type": "object",
          "description": "The main table to select from",
          "properties": {
            "table": {
              "type": "string",
              "description": "Table name (case sensitive)"
            },
            "as": { "type": "string", "description": "Alias for the table" }
          }
        },
        "join": {
          "type": "array",
          "description": "Tables to join with the main table",
          "items": {
            "type": "object",
            "properties": {
              "table": {
                "type": "string",
                "description": "Table name (case sensitive)"
              },
              "as": { "type": "string", "description": "Alias for the table" },
              "type": {
                "enum": ["inner", "left", "right", "full"],
                "description": "Type of join"
              },
              "on": {
                "type": "array",
                "description": "Join conditions, implicitly combined with AND",
                "items": {
                  "type": "object",
                  "properties": {
                    "left": {
                      "type": "string",
                      "description": "Column from the main table"
                    },
                    "right": {
                      "type": "string",
                      "description": "Column from the joined table"
                    }
                  }
                }
              }
            }
          }
        },
        "select": {
          "type": "array",
          "description": "Select columns with optional aliases and aggregation/window functions",
          "items": {
            "type": "object",
            "required": ["column"],
            "properties": {
              "column": {
                "type": "string",
                "description": "Column name to select (prefixed with table alias)"
              },
              "as": { "type": "string", "description": "Alias for the column" },
              "function": {
                "enum": [
                  "count",
                  "sum",
                  "avg",
                  "min",
                  "max",
                  "row_number",
                  "rank",
                  "dense_rank",
                  "lag",
                  "lead",
                  "first_value",
                  "last_value",
                  "nth_value"
                ],
                "description": "Aggregation or window function to apply"
              },
              "expression": {
                "type": "string",
                "description": "SQL expression for a calculated column (can reference earlier aliases; multi-layer CTEs resolve dependencies)"
              },
              "filter": {
                "type": "object",
                "description": "Filter conditions for the aggregation function (PostgreSQL FILTER)"
              },
              "window": {
                "type": "object",
                "description": "OVER clause for window functions",
                "properties": {
                  "partitionBy": {
                    "type": "array",
                    "items": { "type": "string" }
                  },
                  "orderBy": { "type": "array" }
                }
              }
            }
          }
        },
        "where": {
          "type": "object",
          "description": "Filter clause with logical operators (column/operator/value or expression, combined via and/or/not)",
          "properties": {
            "column": { "type": "string" },
            "expression": { "type": "string" },
            "operator": { "enum": ["=", ">", ">=", "<", "<=", "!=", "in"] },
            "value": { "type": "string" },
            "and": { "type": "array" },
            "or": { "type": "array" },
            "not": { "type": "boolean" }
          }
        },
        "groupBy": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Group by columns (prefixed with table alias)"
        },
        "orderBy": {
          "type": "array",
          "description": "Order by columns",
          "items": {
            "type": "object",
            "properties": {
              "column": { "type": "string" },
              "direction": { "enum": ["asc", "desc"] }
            }
          }
        },
        "limit": { "type": "number" },
        "offset": { "type": "number" }
      }
    },
    "calculatedColumns": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "type", "expression"],
        "properties": {
          "name": { "type": "string" },
          "type": {
            "enum": [
              "string",
              "number",
              "boolean",
              "date",
              "time",
              "datetime",
              "object"
            ]
          },
          "description": { "type": "string" },
          "enum": { "type": "array", "items": { "type": "string" } },
          "expression": {
            "type": "string",
            "description": "Computed-column JS expression"
          },
          "schema": {
            "type": "object",
            "description": "JSON Schema for object columns"
          }
        }
      }
    }
  }
}
```

## Example

`artifacts/views/OrdersOverview.json` — orders joined to customers, one row per order with the customer name and total:

```json
{
  "name": "OrdersOverview",
  "description": "Orders with customer name and computed total",
  "query": {
    "from": { "table": "Order", "as": "o" },
    "join": [
      {
        "table": "Customer",
        "as": "c",
        "type": "left",
        "on": [{ "left": "o.customerId", "right": "c.id" }]
      }
    ],
    "select": [
      { "column": "o.id", "as": "orderId" },
      { "column": "c.name", "as": "customerName" },
      { "column": "o.amount", "function": "sum", "as": "total" }
    ],
    "where": { "column": "o.status", "operator": "=", "value": "open" },
    "groupBy": ["o.id", "c.name"],
    "orderBy": [{ "column": "total", "direction": "desc" }],
    "limit": 100
  },
  "calculatedColumns": [
    {
      "name": "totalWithTax",
      "type": "number",
      "expression": "item.total * 1.1",
      "description": "Order total including 10% tax"
    }
  ]
}
```

The base table lives under `query.from.table` (with an optional `as` alias). Joined tables are referenced by alias in `select`, `where`, `groupBy`, and `orderBy`.

## Update & delete

- **Update:** write the artifact with the **same name** as an existing view → it is updated in place (editViews): the query, description, and calculated columns are updated (calculated columns are added/updated/removed to match). **`technicalDescription` is set on create only** — editViews does not accept it, so changing it on an existing view has no effect until the view is deleted and recreated.
- **Delete:** remove the artifact file from `artifacts/views/` to delete the view on sync.

After any view change, run **`pnpm gen:types`**.
