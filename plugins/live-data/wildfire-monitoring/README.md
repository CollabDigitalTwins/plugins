# Wildfire Monitoring

Live wildfires across Canada from the Canadian Interagency Forest Fire Centre (CIFFC), with optional raster overlays for wildfire smoke, fire perimeters and the Fire Weather Index.

| | |
|---|---|
| **Slug** | `wildfire-monitoring` |
| **Category** | `live-data` |
| **Capabilities** | `map.datasets`, `map.layers`, `viewer.legends` |
| **Configuration** | none |
| **Permissions** | none |
| **Network** | browser only, CORS-enabled public endpoints, no API key |

This is the reference example for the repository. It is small enough to read in one sitting, and it shows one dataset driving a layer and a legend through shared plugin state.

## What it does

- **`map.datasets`** lists *Current Active Fires by Size* under **Live Data** in the Datasets menu. Nothing is fetched until a user applies it there.
- **`map.layers`** draws the fires reported in the month picked on the legend's slider, coloured and sized by area burned, with a popup on click. It reads `usePluginDataset('active-fires')`, so it only draws while the dataset is applied and visible.
- **`viewer.legends`** nests under the dataset in the applied-layers card. It has a switch and a live count for each size band, the month slider, and a switch for each raster overlay (all off until picked). While an overlay is on, the legend shows its colour ramp.

## How it is built

```
src/
├── index.ts                     activate(): registers the dataset, the layer and the legend
├── fires.ts                     CIFFC feed → GeoJSON, size bands, MapLibre expressions
├── firesState.ts                shared state (usePluginState) and the 15-minute feed loader
├── overlays.ts                  WMS overlay definitions and tile/legend URLs
├── useFireLayer.ts              adds the GeoJSON layer, survives basemap switches
├── useOverlayLayer.ts           adds one raster overlay beneath the fires
├── useActiveFiresLegend.tsx     the legend rows and controls
└── components/                  the layer, popup, slider and overlay legends
```

Patterns worth copying:

- **One dataset gates everything.** The layer and the legend both read `usePluginDataset`, so applying or hiding the dataset in the platform's own UI is the only switch a user needs.
- **State shared across surfaces.** The layer and the legend are separate registrations, but they read the same feed, month and switches through `usePluginState`. Only one surface fetches.
- **Surviving a basemap switch.** Changing the basemap drops every source and layer, so each hook re-adds its layer on `styledata` and removes it with guards on cleanup.
- **Updating without flicker.** A refresh calls `setData` / `setTiles` on the existing source instead of tearing the layer down.
- **Translations with fallbacks.** Every `t()` call passes inline English, so the plugin reads correctly in a locale it has not translated. `manifest.json` carries `en`, `fr` and `es`.

## Data sources

| Data | Provider | Endpoint | Refresh |
|---|---|---|---|
| Active fires | [CIFFC](https://ciffc.net/) | `https://api.ciffc.net/v1/dashboard/fires` | every 15 minutes |
| Wildfire smoke (surface PM2.5) | ECCC FireWork via [GeoMet](https://eccc-msc.github.io/open-data/msc-geomet/readme_en/) | WMS `RAQDPS.Sfc_PM2.5-WildfireSmokePlume` at `https://geo.weather.gc.ca/geomet` | current UTC hour |
| Fire perimeter estimates | NRCan [CWFIS](https://cwfis.cfs.nrcan.gc.ca/) | WMS `m3_polygons_current` at `https://cwfis.cfs.nrcan.gc.ca/geoserver/public/wms` | daily |
| Fire Weather Index | NRCan CWFIS | WMS `fwi`, same server | today (UTC) |

All four are called straight from the browser; each sends `Access-Control-Allow-Origin: *`. The CIFFC point geometry is unreliable (it has sent `[lat, lat]`), so each point is rebuilt from `field_longitude` and `field_latitude`. The overlays always show the present, and the month slider only filters the CIFFC points.

CWFIS also publishes `currentSmoke`, a copy of the same FireWork model. It is not used because it fails more often than the original.

Each provider sets its own terms of use. Check them before you redistribute the data or use it beyond display. This plugin stores nothing: it fetches and draws.

## Build and run

```bash
npm ci
npm run build        # writes dist/index.js
npm run typecheck
```

Mount the repository on a CDT instance (see [Getting started](../../../README.md#getting-started)), refresh the Plugins page, and turn on **Wildfire Monitoring**. Then open a map, go to **Datasets → Live Data** and apply *Current Active Fires by Size*.
