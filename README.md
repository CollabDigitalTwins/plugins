<div align="center">
  <br />
  <img src="https://github.com/collabdt/docs/raw/main/static/img/cdt-logo.svg" alt="Collab Digital Twins Logo" height="72" />
  <br /><br />

  <h1>CDT COMMUNITY PLUGINS</h1>

  <p><strong>Open-source plugins for the Collab Digital Twins platform, built and shared by the community</strong></p>

  <p>
    <a href="https://docs.collabdt.org/docs/plugins/overview">Plugin Docs</a> ·
    <a href="#use-these-plugins">Use the plugins</a> ·
    <a href="#build-a-plugin">Build a plugin</a> ·
    <a href="CONTRIBUTING.md">Contributing</a> ·
    <a href="https://collabdt.org">Website</a>
  </p>

  <br />

  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0--or--later-blue?style=flat-square" alt="AGPL-3.0-or-later" /></a>
  <a href="https://github.com/CollabDigitalTwins/plugins/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/CollabDigitalTwins/plugins/ci.yml?branch=main&style=flat-square&label=CI" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/@collabdt/core"><img src="https://img.shields.io/npm/v/@collabdt/core?style=flat-square&color=orange&label=%40collabdt%2Fcore" alt="@collabdt/core version" /></a>
  <a href="https://www.npmjs.com/package/@collabdt/plugin-kit"><img src="https://img.shields.io/npm/v/@collabdt/plugin-kit?style=flat-square&color=orange&label=%40collabdt%2Fplugin-kit" alt="plugin-kit version" /></a>
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs welcome" />

  <br /><br />
  <hr />
  <br />
</div>

## What is this?

[Collab Digital Twins](https://collabdt.org) (CDT) is an open-source, web-based digital twin platform for buildings and cities, with BIM, GIS and point clouds in one place. A **plugin** adds one feature to it, such as a live-data layer on the map, a tool in the BIM viewer, a legend, or a data page. The platform works without any plugin, and turning one on adds its feature.

This repository is where the community shares plugins. Anyone can read them, run them on their own CDT instance, learn from them, and contribute new ones through pull requests.

> **New here?** Start with [`wildfire-monitoring`](plugins/live-data/wildfire-monitoring). It is a complete, working plugin that draws live Canadian wildfires from public government feeds, and it is small enough to read in one sitting.

The [plugin documentation](https://docs.collabdt.org/docs/plugins/overview) is the source of truth for the plugin API, capabilities and registry. This README only covers how this repository works. When the two disagree, the docs win.

---

## Plugins

| Plugin | Category | What it does |
|---|---|---|
| [Wildfire Monitoring](plugins/live-data/wildfire-monitoring) | `live-data` | Active wildfires across Canada (CIFFC), with smoke, fire perimeter and Fire Weather Index overlays (ECCC, NRCan) |

Add a row here when you add a plugin.

---

## How a plugin reaches users

There are two paths, and **merging into this repository is neither of them on its own**:

1. **Your own instance.** If you run CDT yourself, mount this repository's `plugins/` folder (see [Use these plugins](#use-these-plugins)). Your administrators then choose which plugins to turn on.
2. **CDT-hosted instances** (such as [app.collabdt.org](https://app.collabdt.org)). Maintainers publish a reviewed version to the **CDT plugin registry**. A platform admin then shares it with each organization that wants it, and that organization's administrators turn it on.

Plugins run with the same privileges as the platform, so each path ends with a person deciding to trust the code. See [Security](#security).

---

## Repository layout

```
plugins/                          (this repository)
├── package.json                  npm run build | validate | check
├── scripts/                      build, validation and CI helpers
├── plugins/
│   ├── live-data/                real-time feeds, sensors, transit, IoT
│   ├── utilities/                general-purpose viewer and map tools
│   ├── facility-management/      operations, assets, space, maintenance
│   ├── planning/                 city data turned into evidence for decisions
│   └── demos/                    scripted scenarios for presentations
└── .github/                      CI, CLA, templates, code owners
```

Each plugin lives in its own folder under its category, optionally inside one project folder:

```
plugins/<category>/<plugin>/
├── manifest.json                 slug, version, capabilities, translations
├── package.json                  build scripts, same version as the manifest
├── package-lock.json             committed: CI installs with npm ci
├── tsup.config.ts                pluginPreset() from @collabdt/plugin-kit
├── src/                          source
├── dist/index.js                 the built bundle (gitignored)
└── README.md                     what it does, configuration, data sources
```

The folder name is only a convenience. **A plugin's identity is the `slug` in its manifest:** settings, translations, stored data and registry entries are all keyed by it, so a slug never changes once a plugin is merged.

---

## Use these plugins

You need a running CDT instance, either self-hosted from the Docker image or a local development build. Requires Node.js 22 or later.

**1. Fork, then clone.** Fork [CollabDigitalTwins/plugins](https://github.com/CollabDigitalTwins/plugins/fork) on GitHub, so you have your own copy to change and to open pull requests from. Then clone your fork into the folder your instance reads plugins from, and add the original as `upstream` to pull in new plugins:

```bash
cd /path/to/cdt/plugins
git clone https://github.com/<you>/plugins.git cdt-community-plugins
cd cdt-community-plugins
git remote add upstream https://github.com/CollabDigitalTwins/plugins.git
git pull upstream main     # later, to get updates
```

**2. Build** the plugins. `dist/` is not committed, and a plugin without `dist/index.js` is skipped:

```bash
npm run build
```

`npm run build` only rebuilds what changed, so later runs take seconds. It installs a plugin's dependencies when they are missing or its lockfile changed, carries on past a failing plugin, and lists the failures at the end. Use `npm run build -- --force` to rebuild everything.

**3. Point CDT at the folder.** `PLUGINS_DIR` is the folder that contains the clone. With Docker Compose:

```yaml
services:
  cdt:
    environment:
      PLUGINS_ENABLED: "true"
      PLUGINS_DIR: /app/plugins
    volumes:
      - ./plugins:/app/plugins:ro
```

For a local development build, set the same variables in the app's `.env`, using an absolute path for `PLUGINS_DIR`. Add `PLUGINS_DEV="true"` while developing, so a rebuilt plugin shows up on a browser refresh.

**4. Turn plugins on.** Open the **Plugins** page as an administrator. Built plugins are listed under **Found on this server**, and an administrator decides which ones run. Full walkthrough: [Mounting a plugin](https://docs.collabdt.org/docs/plugins/mounting-a-plugin).

### How CDT finds plugins

- Any folder holding a `manifest.json` is a plugin. CDT looks up to **five folders deep** below `PLUGINS_DIR`, so `cdt-community-plugins/plugins/<category>/<project>/<plugin>` is the deepest a plugin can sit.
- It skips `node_modules`, `dist`, `build`, `out`, `coverage` and dot-folders, does not follow symlinks, and never looks for a plugin inside another plugin.
- A plugin with an invalid manifest or no `dist/index.js` is skipped, and the server log names it and the reason.
- **Two folders with the same `slug` are both skipped.** If you keep a personal copy of a plugin from here, change its slug.

To use only some plugins, clone sparsely:

```bash
git clone --filter=blob:none --sparse https://github.com/CollabDigitalTwins/plugins.git cdt-community-plugins
cd cdt-community-plugins
git sparse-checkout set plugins/live-data/wildfire-monitoring
```

---

## Build a plugin

The short version is below. The full steps, rules and review process are in **[CONTRIBUTING.md](CONTRIBUTING.md)**.

```bash
# fork on GitHub first, then:
git clone https://github.com/<you>/plugins.git cdt-community-plugins
cd cdt-community-plugins
git switch -c feat/<your-plugin>

cd plugins/<category>
npx create-cdt-plugin
cd <your-plugin>
npm install
npm run build
```

[`create-cdt-plugin`](https://www.npmjs.com/package/create-cdt-plugin) writes a manifest, an entry point, a working component and the build setup through [`@collabdt/plugin-kit`](https://www.npmjs.com/package/@collabdt/plugin-kit). Its preset bundles your plugin into the single file the platform serves, and **fails the build if you import a library the platform does not provide**, such as a second copy of React or three.js. Every prompt has a flag, e.g. `npx create-cdt-plugin --name "Room Inventory" --surface map.tools --yes`.

Then set `"category"` in `manifest.json` and `"license": "AGPL-3.0-or-later"` in `package.json`, write the plugin's README, test it on a CDT instance, run `npm run check` from the repository root, and open a pull request.

The manifest fields CDT reads:

| Field | Required | Purpose |
|---|---|---|
| `slug` | yes | Identity and namespace. Lowercase letters, digits and single hyphens, max 64, unique in this repository. Never changes after merge |
| `name` | yes | Shown on the Plugins page |
| `version` | yes | Semver, kept equal to `package.json`. Each published version is immutable |
| `hostApi` | yes here | The plugin API it was built against. Use `1` |
| `capabilities` | yes | What the plugin may register, e.g. `map.layers`, `map.tools`, `bim.tools`, `viewer.legends`, `data.pages`. See [Capabilities](https://docs.collabdt.org/docs/plugins/all-capabilities) |
| `category` | yes here | Must match the category folder it lives in |
| `description`, `author`, `icon` | no | Shown on the Plugins page. `icon` is a [lucide](https://lucide.dev/icons/) name |
| `requiredPermissions` | no | Shown to an administrator before they turn the plugin on |
| `configSchema` | no | Settings an administrator can change without touching code |
| `messages` | no | Translations by locale (`en` required if present; `fr`, `es` welcome), folded under `plugins.<slug>` |

Learn more:

- [Create your first plugin](https://docs.collabdt.org/docs/plugins/create-your-first-plugin)
- [Building a plugin with AI](https://docs.collabdt.org/docs/plugins/building-a-plugin-with-ai)
- [Call an API without CORS](https://docs.collabdt.org/docs/plugins/proxied-feeds), for live feeds the browser cannot reach directly
- [Share and promote plugins](https://docs.collabdt.org/docs/plugins/plugin-registry), the registry flow

---

## What CI checks

Every pull request runs these checks. `npm run check` runs the same validation and build locally.

| Check | What it enforces |
|---|---|
| **Validate** | Manifest rules the platform enforces (slug, semver, `hostApi`, known capabilities), unique slugs, category matching its folder, `package.json` matching the manifest, a README and `package-lock.json`, the plugin-kit preset, SPDX headers on source files, no committed `dist/`, `node_modules/` or `.env`, and **a version bump for every changed plugin** |
| **Build** | For each changed plugin: `npm ci` with install scripts disabled, a type-check, the build (including the import guard), its tests if it has any, and the 5 MiB bundle limit |
| **Secret scan** | [TruffleHog](https://github.com/trufflesecurity/trufflehog) over the pull request's commits |
| **No AI attribution** | Commits credit people, not AI assistants |
| **CLA** | Every contributor has signed the [Contributor License Agreement](CLA.md) |

Passing CI is required, but it is not a security review. Maintainers still read the code.

---

## Versioning and publishing

- Versions follow [semver](https://semver.org): patch for fixes, minor for new features, major when a change breaks existing settings or removes something an administrator relied on.
- Bump `version` in **both** `manifest.json` and `package.json` in the same pull request as the change. README-only changes keep their version.
- Published versions are **immutable**. A fix is always a new version.
- Only maintainers publish to the CDT registry, and only from merged code. Once a version is published, platform admins can share it with organizations and pin an organization to a version.

---

## Security

**Plugins run with the same privileges as the platform. There is no sandbox.** Read the code of any plugin before you turn it on, including plugins from this repository, and mount a commit or tag you have reviewed rather than a moving branch.

For contributors: never commit secrets, API keys or tokens. A feed that needs a key or does not send CORS headers goes through an allowlisted [proxied feed](https://docs.collabdt.org/docs/plugins/proxied-feeds) on the instance, never through a key in the bundle.

Found a vulnerability? Please report it privately, as described in [SECURITY.md](SECURITY.md).

---

## Licensing

Plugins in this repository are licensed under the [GNU Affero General Public License v3.0 or later](LICENSE). Every source file carries an `SPDX-License-Identifier: AGPL-3.0-or-later` header.

Contributors sign the same [Contributor License Agreement](CLA.md) used across CDT repositories. You keep the copyright in your work, and Collab Digital Twins can distribute it under both the AGPL and its commercial terms. You will be asked to sign it on your first pull request.

Data that plugins fetch belongs to its publishers and is governed by their terms, not by this licence. Each plugin's README names its sources.

Everyone taking part is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

---

<div align="center">
  <sub>Stewarded by a Canadian not-for-profit organization for long-term public benefit.</sub>
</div>
