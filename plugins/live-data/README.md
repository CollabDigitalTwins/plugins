<div align="center">
  <br />
  <img src="https://github.com/collabdt/docs/raw/main/static/img/cdt-logo.svg" alt="Collab Digital Twins Logo" height="56" />
  <br /><br />

  <h1>LIVE DATA</h1>

  <p><strong>Plugins that stream the world into the twin</strong></p>

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

Plugins in this section bring **changing, real-time data** onto the map or into the BIM viewer: transit vehicles, sensors, weather, air quality, IoT devices, anything that is out of date a few minutes after it loads.

The CDT platform does not store this data. A live-data plugin reads it from its source, refreshes it on an interval, and draws it as layers, markers or legends. It is the plugin version of CDT's broader idea: a **framework for referencing and linking distributed data sources**, not a system of record.

---

## Plugins

| Plugin | What it does |
|---|---|
| [`wildfire-monitoring`](wildfire-monitoring) | Active wildfires across Canada (CIFFC), with smoke, perimeter and Fire Weather Index overlays. **The reference example for this repository.** |

---

## Examples of what could go here

- Vehicle or fleet positions, e.g. GTFS-RT transit feeds
- Sensor readings, e.g. OGC SensorThings endpoints
- Weather radar, alerts and air-quality feeds
- Building telemetry: occupancy, energy, HVAC

Plugins here usually register `map.datasets`, `map.layers`, `viewer.legends` and `map.tools`.

---

## Guidelines

- **Poll politely.** Pick a refresh interval the provider allows, fetch nothing until a user applies the dataset, and stop polling when its layer is hidden.
- **No CORS? Use a proxied feed.** A plugin calls `fetch` from the page, so it can only reach APIs that send CORS headers. Anything else goes through a feed an administrator allowlists on their instance. See [Call an API without CORS](https://docs.collabdt.org/docs/plugins/proxied-feeds).
- **Never commit keys.** A key the administrator enters is forwarded by the proxy; it is never baked into the bundle.
- **Show when data is stale.** Keep the last good data on screen and flag it in the legend, instead of clearing the map when a request fails.
- **Say where the data comes from** in the plugin's README: the provider, its terms and its update rate.

---

## Adding a plugin

```bash
cd plugins/live-data
npx create-cdt-plugin
```

Set `"category": "live-data"` in its `manifest.json`, then follow [Step by step](../../CONTRIBUTING.md#step-by-step) in the contributing guide.
