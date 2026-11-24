# Security Policy

## Plugins are trusted code

A CDT plugin runs in the browser with the same privileges as the platform: there is no sandbox. A malicious or careless plugin can read anything the signed-in user can see and act as that user. This shapes how this repository works:

- **Maintainers read every line of every pull request before merging.** CI checks structure, builds the bundle and scans for secrets, but it does not decide whether code is safe.
- **Merging here does not install a plugin anywhere.** A plugin reaches CDT-hosted instances only when maintainers publish a reviewed version to the CDT plugin registry, and an organization only gets it when a platform admin shares it.
- **If you mount this repository on your own instance, you are trusting its code.** Mount a specific commit or tag you have read, not a moving branch.

## Reporting a vulnerability

Please **do not open a public issue**. Report it privately through either channel:

- 🔒 GitHub's [private vulnerability reporting](https://github.com/CollabDigitalTwins/plugins/security/advisories/new) (**Security → Report a vulnerability**), or
- 📧 **[support@collabdt.org](mailto:info@collabdt.org)**

Include the plugin and version, the steps to reproduce, the impact you see, and any fix you suggest. We will acknowledge your report within **10 business days**, keep you informed while we fix it, and credit you in the advisory if you would like.

Collab Digital Twins follows coordinated vulnerability disclosure. Please give us reasonable time to fix an issue before you disclose it, and do not test against instances you do not own or have permission to test.

## Scope

In scope:

- Plugins in this repository, at any published version
- The repository's scripts and CI workflows
- A plugin's dependencies, when the plugin's own use of them is affected

Report these elsewhere:

- The CDT platform or `@collabdt/core`: follow the [core security policy](https://github.com/CollabDigitalTwins/core/security/policy)
- A third-party data provider a plugin calls: report it to that provider

## What contributors must never commit

API keys, tokens, passwords, private URLs, personal data, or `.env` files. If one lands in a commit, even in a closed pull request, **assume it is compromised and rotate it**: removing it from the branch does not remove it from git history or from forks.
