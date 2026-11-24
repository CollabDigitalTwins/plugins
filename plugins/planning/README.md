<div align="center">
  <br />
  <img src="https://github.com/collabdt/docs/raw/main/static/img/cdt-logo.svg" alt="Collab Digital Twins Logo" height="56" />
  <br /><br />

  <h1>PLANNING</h1>

  <p><strong>City data turned into evidence for decisions</strong></p>

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

Plugins in this section **combine datasets into indicators** about land use, access and change: who can reach what, where provision depends on a single place, what development is coming, and what a planner should look at next.

They usually pair a map (layers, a tool panel, a legend) with a **report page** of charts and tables. The data stays with its publisher; the plugin keeps the method, the assumptions and the links back to the source.

---

## Examples

- Community or service inventories mapped against transit and walking access
- Development applications and building permits near assets of interest
- Catchments, provision gaps and "what if this site closed" scenarios
- Report-style dashboards that replace a static PDF study with a live one

Plugins here usually register `map.layers`, `map.tools`, `map.datasets`, `viewer.legends`, `data.pages` and `ui.dialogs`.

---

## Guidelines

- **Keep provenance.** Every record keeps its source id and source layer, so a finding can be traced back. Never rewrite a publisher's ids.
- **Declare assumptions.** Walking speed, service dates, radii and thresholds are shown in the UI and the README, and kept in one place in code.
- **Label what is pending.** If an input is a placeholder or a stand-in, say so on screen. A proxy is never presented as the real measure.
- **Report raw values next to ranks**, and distinct places next to record counts.
- **Precompute heavy work at build time** (routing, large spatial joins) with a script in `scripts/`, and commit its output together with the date and source version it ran on, so a result can be reproduced.

---

## Projects with several plugins

A project with several plugins gets its own folder with **no `manifest.json`**, and each plugin lives in a child folder. This is the deepest a plugin can sit:

```
planning/
  my-project/             ← project folder: README and resources, no manifest
    resources/            ← briefs and reference material (never loaded)
    my-plugin/            ← plugin
```

---

## Adding a plugin

```bash
cd plugins/planning
npx create-cdt-plugin
```

Set `"category": "planning"` in its `manifest.json`, then follow [Step by step](../../CONTRIBUTING.md#step-by-step) in the contributing guide.
