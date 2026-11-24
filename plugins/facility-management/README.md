<div align="center">
  <br />
  <img src="https://github.com/collabdt/docs/raw/main/static/img/cdt-logo.svg" alt="Collab Digital Twins Logo" height="56" />
  <br /><br />

  <h1>FACILITY MANAGEMENT</h1>

  <p><strong>Operations, assets, space and maintenance</strong></p>

  <p>
    <a href="../../README.md">CDT Community Plugins</a> ·
    <a href="../../CONTRIBUTING.md">Contributing</a> ·
    <a href="https://docs.collabdt.org/docs/plugins/all-capabilities">Capabilities</a>
  </p>

  <br />
  <hr />
  <br />
</div>

## What belongs here?

Plugins in this section support **operations and maintenance**: the people who look after buildings and campuses day to day, rather than those who design or build them.

They connect the model and the map to the work done on them: where an asset is, what condition it is in, who is in a space and what needs fixing next.

---

## Examples

- Space planning, room inventories and occupancy
- Asset registers and equipment lookups linked to BIM elements
- Work orders, inspections and maintenance schedules
- Floor plans and wayfinding for occupants

Plugins here usually register `bim.tools`, `data.pages`, `ui.dialogs` and `viewer.tabs`.

---

## Guidelines

- **Link, don't copy.** Most organizations already keep assets and work orders in another system. Reference its records by id and fetch them, rather than duplicating them in a plugin.
- **Mind permissions.** Occupancy and maintenance data can be sensitive. List what the plugin reads in `requiredPermissions`, so an administrator sees it before turning it on.
- **No real occupant data in the repository.** Fixtures and screenshots use made-up people and rooms.

---

## Adding a plugin

```bash
cd plugins/facility-management
npx create-cdt-plugin
```

Set `"category": "facility-management"` in its `manifest.json`, then follow [Step by step](../../CONTRIBUTING.md#step-by-step) in the contributing guide.
