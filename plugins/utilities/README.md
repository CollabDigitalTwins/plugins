<div align="center">
  <br />
  <img src="https://github.com/collabdt/docs/raw/main/static/img/cdt-logo.svg" alt="Collab Digital Twins Logo" height="56" />
  <br /><br />

  <h1>UTILITIES</h1>

  <p><strong>General-purpose tools for any project</strong></p>

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

Plugins in this section are **tools that help in any project**, whatever the building, city or dataset. They work on what is already in the viewer rather than bringing in a data source of their own.

If a plugin would be useful to almost every organization on the CDT platform and does not belong to one domain, it belongs here.

---

## Examples

- Measuring distances, areas and heights
- Coordinates, bookmarks and map-centre helpers
- Exporting views, screenshots and selections
- Viewer helpers: sectioning presets, camera shortcuts, layer shortcuts

Plugins here usually register `map.tools`, `bim.tools`, `viewer.tabs` and `ui.dialogs`.

---

## Guidelines

- **Stay generic.** A tool that only makes sense for one domain or one data source belongs in that domain's section.
- **Use what the platform hands you.** Map and BIM tools receive their viewer as props; never reach into core internals.
- **Keep it small.** Utilities are often turned on everywhere, so their bundle size adds up.

---

## Adding a plugin

```bash
cd plugins/utilities
npx create-cdt-plugin
```

Set `"category": "utilities"` in its `manifest.json`, then follow [Step by step](../../CONTRIBUTING.md#step-by-step) in the contributing guide.
