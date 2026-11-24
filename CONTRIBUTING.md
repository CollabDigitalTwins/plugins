# Contributing to CDT Community Plugins

Thank you for helping build the Collab Digital Twins ecosystem. This guide covers the rules every plugin follows, the steps from idea to merged pull request, and what reviewers look for.

By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- **Fix or improve an existing plugin.** Bugs, translations, accessibility and documentation all count.
- **Add a new plugin.** For a new category, or a plugin that calls a new external service, [open a proposal](https://github.com/CollabDigitalTwins/plugins/issues/new?template=plugin_proposal.yml) first so we can agree on the approach before you build it.
- **Report a bug** with the [bug form](https://github.com/CollabDigitalTwins/plugins/issues/new?template=bug_report.yml). Report a vulnerability privately, as described in [SECURITY.md](SECURITY.md).

Changes to the platform or the plugin API itself belong in [`CollabDigitalTwins/core`](https://github.com/CollabDigitalTwins/core).

---

## The rules

These protect the people who turn plugins on. A pull request that breaks one will not be merged, whatever CI says.

### Security and privacy

1. **No secrets, ever.** No API keys, tokens, passwords, private URLs or `.env` files in code, fixtures, screenshots or commit history. A feed that needs a key goes through a [proxied feed](https://docs.collabdt.org/docs/plugins/proxied-feeds), where an administrator enters the key on their own instance.
2. **Declare every network call.** The plugin's README lists every host it contacts. Do not call any other host, and do not build request URLs from user input or remote data.
3. **No tracking.** No analytics, telemetry, fingerprinting or calls home. A plugin does not collect personal data unless that is its stated purpose, the data is listed in `requiredPermissions`, and the README explains why.
4. **No remote or hidden code.** No `eval`, no `new Function`, no importing scripts from a URL at runtime, and no minified or obfuscated source. Reviewers must be able to read everything that runs.
5. **Use only what the platform provides.** Build with `pluginPreset()` from `@collabdt/plugin-kit`, which refuses any import the platform has no shim for. Never reach into `@collabdt/core` internals, only the public `@collabdt/core/plugins-sdk` entries.
6. **No install scripts.** A plugin's `package.json` has no `preinstall`, `install`, `postinstall` or `prepare` script, and CI installs dependencies with theirs disabled.

### Data

7. **Say where the data comes from.** For each source, the README names the provider, the endpoint, its update rate and a link to its terms of use or licence.
8. **Respect the provider.** Poll at an interval the provider allows, stop polling when the layer is hidden, and do not fetch anything until a user turns the feature on.
9. **Label what is made up.** Synthetic or sample data is labelled as such in the manifest description, the README and on screen.

### Structure

10. **One plugin per folder**, at `plugins/<category>/<plugin>` or one project folder deeper. The manifest's `category` matches its folder.
11. **The slug is permanent.** It keys settings, translations, stored data and the registry. Renaming a plugin means a new slug in a new folder, and the old one is deprecated.
12. **npm only.** Commit `package-lock.json`, and no other lockfile. Never commit `dist/` or `node_modules/`.
13. **Licence headers.** Every source file starts with:
    ```ts
    // SPDX-License-Identifier: AGPL-3.0-or-later
    // Copyright (C) <year> <you or your organization>
    ```
    `package.json` sets `"license": "AGPL-3.0-or-later"` and `"private": true`.
14. **Translations.** Every user-facing string goes through `usePluginTranslations()` with an inline English fallback, and `manifest.json` carries `messages.en`. French and Spanish are welcome.
15. **One plugin per pull request**, unless the change is mechanical across many (e.g. a dependency bump).

### Authorship

16. **Sign the CLA.** You keep your copyright; the [Contributor License Agreement](CLA.md) lets us distribute your work under the AGPL and our commercial terms. Signing is one comment on your first pull request, and covers every later one. See [Signing the CLA](#signing-the-cla) below. If you contribute on behalf of an employer, they sign Part B.
17. **Commits credit people.** You are welcome to use an AI assistant, but no commit may list one as author or co-author (`Co-authored-by:` trailers, "Generated with" footers). Mention it in the pull request description instead.
18. **Only contribute code you have the right to contribute.** Code copied from elsewhere must be AGPL-compatible, and you credit the source.

---

## Step by step

### 1. Set up

You need Node.js 22 or later, git, and a CDT instance to test on: either [self-hosted](https://docs.collabdt.org/) with Docker or a local development build.

```bash
# Fork CollabDigitalTwins/plugins on GitHub, then:
git clone https://github.com/<you>/plugins.git cdt-community-plugins
cd cdt-community-plugins
git remote add upstream https://github.com/CollabDigitalTwins/plugins.git
```

Clone it inside the folder your instance's `PLUGINS_DIR` points at, so the plugins you build appear on the instance right away. See [Use these plugins](README.md#use-these-plugins).

### 2. Branch

Always branch from an up-to-date `upstream/main`:

```bash
git fetch upstream
git switch -c feat/<plugin-slug> upstream/main
```

Use `feat/…` for new plugins or features, `fix/…` for fixes and `docs/…` for documentation.

### 3. Scaffold (new plugins)

```bash
cd plugins/<category>
npx create-cdt-plugin
cd <your-plugin>
```

Then edit what the scaffold does not set for this repository:

- `manifest.json`: `"category": "<category>"`, `"hostApi": 1`, and an `author`
- `package.json`: `"license": "AGPL-3.0-or-later"`
- the copyright line in the SPDX headers

Unsure which category fits? Read each category's README in [`plugins/`](plugins). A new category is welcome, but propose it in an issue first.

### 4. Develop and test on a real instance

```bash
npm install        # creates package-lock.json; commit it
npm run dev        # rebuilds dist/index.js on save
```

If you later change dependencies, regenerate the lockfile from scratch (delete `node_modules` and `package-lock.json`, then `npm install`). Updating it in place on Windows or macOS can drop the Linux build tools CI needs, and `npm run check` will tell you if that happened.

With `PLUGINS_DEV="true"` on your instance, refresh the browser to pick up each rebuild. Turn the plugin on from the Plugins page and use it the way a user would, including:

- switching the basemap, and hiding and showing the layer, if it draws on the map
- a locale other than English
- the data source failing or being slow
- turning the plugin off: it must leave nothing behind (layers, listeners, timers)

### 5. Document

The plugin's `README.md` covers: what it does, the capabilities it registers, its configuration, every data source (provider, endpoint, refresh rate, terms), and how to build it. [`wildfire-monitoring`](plugins/live-data/wildfire-monitoring/README.md) is a good model. Add your plugin to the table in the root [README](README.md#plugins).

### 6. Version

A new plugin starts at `0.1.0`. When you change an existing one, bump `version` in **both** `manifest.json` and `package.json`:

| Change | Bump |
|---|---|
| A fix that changes no behaviour a user relies on | patch: `1.2.0 → 1.2.1` |
| A new feature, option, translation or capability | minor: `1.2.0 → 1.3.0` |
| Removes or renames a setting, capability or behaviour administrators rely on | major: `1.2.0 → 2.0.0` |
| README or other Markdown only | none |

CI fails a pull request that changes a plugin's code without bumping its version.

### 7. Check locally

From the repository root:

```bash
npm run check
```

This runs the repository's own tests, validates every plugin, builds them and checks bundle sizes, which is the same validation and build CI does. Fix everything it reports before you push.

> **Declare every type package you import.** If this repository sits inside a CDT app checkout, TypeScript also searches the app's `node_modules`. A missing devDependency, such as `@types/react-dom` for `createPortal`, then type-checks locally and fails in CI. To be sure, test in a clone outside any other project.

### 8. Commit and open a pull request

Write small commits with direct messages, e.g. `feat(wildfire-monitoring): add a perimeter overlay` or `fix(wildfire-monitoring): keep the popup inside the map`.

```bash
git push -u origin feat/<plugin-slug>
```

Open the pull request against `CollabDigitalTwins/plugins:main` and fill in the template. On your first contribution, a maintainer approves the CI run before it starts, and the CLA bot asks you to sign.

#### Signing the CLA

1. Read [CLA.md](CLA.md).
2. Post this exact comment on your pull request, nothing more and nothing less:
   ```
   I have read the CLA Document and I hereby sign the CLA
   ```
3. The **CLA Assistant** check turns green within a minute. If it stays red, comment `recheck`.

Until you sign, the CLA check is red. That is expected and is not a problem with your code. If the bot says a commit author is not linked to a GitHub user, add the email from `git log` to your GitHub account (Settings → Emails) and comment `recheck`.

#### When a CI check fails

Open the failed check and scroll to the first red line. The usual causes:

| Check / message | Fix |
|---|---|
| **CI passed** with `exit 1` and nothing else | This only summarises the other checks. Open whichever one is red. |
| **Validate**: any message | It names the plugin and the fix. Run `npm run check` locally to reproduce. |
| **Build**: `Cannot find module @rollup/rollup-linux-x64-gnu` (or `@esbuild/linux-x64`) | Your lockfile only lists your own operating system's binaries. In the plugin folder delete `node_modules` and `package-lock.json`, run `npm install`, commit the new `package-lock.json`. |
| **Build**: a type error that passes locally | A missing devDependency; see *Declare every type package you import* above. |
| **No AI attribution** | Remove `Co-authored-by:` or "Generated with" lines from your commit messages (`git rebase -i`, then `reword`), and force-push your branch. |
| **CLA Assistant** | See [Signing the CLA](#signing-the-cla). |

Stuck anyway? Comment on the pull request with the link to the failed run, and a maintainer will help.

### 9. Review

A maintainer reviews every line. Expect questions about network calls, data terms and cleanup. Push fixes as new commits; we squash on merge. If your pull request has gone quiet, a polite ping on it is welcome.

### 10. After the merge

Your plugin is now available to everyone who mounts this repository. Publishing to the CDT registry, which is how it reaches CDT-hosted instances, is a separate step done by maintainers, and we will tell you on the pull request when it happens.

---

## What reviewers look for

- The rules above, starting with security and data
- Cleanup: every layer, source, listener, interval and portal is removed when the plugin, its layer or its dataset is turned off
- Resilience: a failing feed shows a stale or unavailable state instead of breaking the viewer
- Bundle size, because a plugin's whole bundle loads when it activates
- A README a stranger could follow

---

## For maintainers

### Repository settings

Set these once on `CollabDigitalTwins/plugins`:

- **Branch protection on `main`:** require a pull request, one approving review, review from code owners, and the status checks **CI passed** and **CLA Assistant**. Dismiss stale approvals on new commits. Disallow force pushes. Allow squash merges only.
- **Actions → General:** require approval for all outside collaborators' workflow runs, and set the default workflow token to read-only.
- **Code security:** turn on private vulnerability reporting, Dependabot alerts, secret scanning and push protection.
- **CLA signatures branch:** create it once with `git push <this repo's remote> main:cla-signatures`, and keep it out of every branch protection rule and ruleset. Without it, the CLA check fails for everyone with `Branch cla-signatures not found`.
- **Teams:** `@CollabDigitalTwins/maintainers` must exist and have write access, or CODEOWNERS reviews will not be requested.

### Before approving a first-time contributor's CI run

CI builds the pull request's code, and a build executes `tsup.config.ts` and the plugin's dependencies. The token is read-only and no secrets are exposed, but read the diff of `package.json`, `package-lock.json`, `tsup.config.ts` and `.github/` before clicking **Approve and run**.

### Publishing

Publish only merged code, from a dev instance with this repository mounted: expand the plugin on the Plugins page and choose **Publish to registry**. Staging and production never read this repository. A version moves between deployments as an exported `.cdtplugin.json` package that a platform admin imports. See [Share and promote plugins](https://docs.collabdt.org/docs/plugins/plugin-registry).

### Keeping the validator in sync

`scripts/validatePlugins.mjs` mirrors the platform's manifest rules (`validateManifest` in `@collabdt/core` and the registry's publish checks). When core adds a capability or changes a rule, update the validator and its tests in the same release.
