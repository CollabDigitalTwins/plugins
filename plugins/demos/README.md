<div align="center">
  <br />
  <img src="https://github.com/collabdt/docs/raw/main/static/img/cdt-logo.svg" alt="Collab Digital Twins Logo" height="56" />
  <br /><br />

  <h1>DEMOS</h1>

  <p><strong>Scripted scenarios for presentations</strong></p>

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

Plugins that tell one story about one place for a talk, a workshop or a meeting: a fixed site, a guided sequence, often with made-up or one-off data. They show what the platform can do. They are not meant to be turned on for an organization's day-to-day work.

---

## Rules for this folder

- **Say what is made up.** If the data is synthetic, the manifest description, the README and the screen all say so.
- **Same build rules as every plugin.** Demos build with `pluginPreset()` and use the viewers the platform hands them. A demo that needs its own copy of a library the platform forbids (such as three.js) does not belong in this repository.
- **Ship the data with the plugin, within reason.** Keep assets small, check you have the right to redistribute them, and credit their source in the README. Large rasters or models are fetched from their publisher, not committed.

---

## Adding a plugin

```bash
cd plugins/demos
npx create-cdt-plugin
```

Set `"category": "demos"` in its `manifest.json`, then follow [Step by step](../../CONTRIBUTING.md#step-by-step) in the contributing guide.
