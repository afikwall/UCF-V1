# Workflow Artifacts

> Part of the [`app-artifacts`](../SKILL.md) skill. Read this before creating a workflow.

A workflow runs an app action when a trigger fires (schedule, webhook, etc.). Define each as `artifacts/workflows/<Name>.json`. The action it triggers must be an app action that already exists (or is created in the same pass). Use **ListActions**/**DescribeActions** to get the trigger type id and the action's input shape.
**Never guess `triggerTypeId` or `actionTypeId`.** Always copy them verbatim from ListActions/DescribeActions output. Writing a workflow artifact with an identifier that does not exist in the app describe is rejectedץ

## File location

`artifacts/workflows/<Name>.json` — e.g. `OnNewOrder.json`.

## JSON schema

```json
{
  "type": "object",
  "required": [
    "name",
    "description",
    "iconName",
    "triggerTypeId",
    "triggerData",
    "actionTypeId",
    "actionInstanceInputs"
  ],
  "properties": {
    "name": { "type": "string", "description": "Workflow name" },
    "description": {
      "type": "string",
      "description": "Include the trigger, the goal, and where output is stored (table/column)"
    },
    "iconName": { "type": "string", "description": "Lucide icon name" },
    "triggerTypeId": {
      "type": "string",
      "description": "Trigger type id from AppDescribe / ListActions"
    },
    "triggerData": {
      "type": "object",
      "description": "Trigger inputs (from the trigger description). Use variables where appropriate."
    },
    "actionTypeId": {
      "type": "string",
      "description": "MUST be a no-code app action created in THIS app (id from ListActions with the app set)"
    },
    "actionInstanceInputs": {
      "type": "object",
      "description": "Map trigger outputs to the action inputs. Variables from inputs start with \"input.\""
    }
  }
}
```

## Notes

- The triggered `actionTypeId` must belong to the current app — not a system/built-in action.
- In `actionInstanceInputs`, every **required** property of the action must be set (constant or variable), or the run fails.
- The id of the user running the workflow is available as `{{input.context.userId}}`.
- Map trigger outputs to action inputs with variables; input-sourced variables start with `input.`.
- Workflow artifacts are synced to blocks: a new workflow is created, an existing one (matched by name) is updated, and removing the artifact file deletes it. Editing a workflow updates its description, icon, `triggerData`, and `actionInstanceInputs` — to change the trigger type or target action, delete and recreate it.
