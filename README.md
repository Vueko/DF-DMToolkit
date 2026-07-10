# DF-DMToolkit

Unofficial 5E-compatible desktop toolkit for Dungeon Masters running tabletop
campaigns. It bundles campaign prep, encounters, initiative, SRD lookup, notes,
maps, music, soundboard controls, and a separate player display into one local
Electron app.

## Features

- DM dashboard with current combat, scenes, rules shortcuts, and player-screen controls.
- Encounter builder and per-encounter combat tracking.
- Bestiary backed by SRD 5.2.1 data from Open5e, plus local homebrew monsters.
- Party manager for player characters and conditions.
- Rules browser for cached SRD rules content.
- Scene, journal, campaign-map, music, and soundboard tools.
- Obsidian vault reader for a world wiki.
- Local-first persistence through Electron storage.

## Legal notice

This project is an unofficial fan-made tool. It is not affiliated with, endorsed,
sponsored, or specifically approved by Wizards of the Coast LLC.

Dungeons & Dragons and related marks are property of Wizards of the Coast LLC.
This project does not include Wizards logos, trade dress, artwork, or non-SRD
rules content.

This work includes material from the System Reference Document 5.2.1 ("SRD
5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd.
The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0
International License, available at
https://creativecommons.org/licenses/by/4.0/legalcode.

SRD data is served by Open5e and cached locally by the app. Application source
code is licensed separately under the MIT License in `LICENSE`. This README is
not legal advice; review the applicable licenses and policies before publishing
or distributing builds.

## Development

```bash
npm install
npm run dev:electron
npm run test
npm run lint
npm run build:electron
```

## Release

The Windows release build is prepared with:

```bash
npm run dist:win
```

The script builds the renderer and Electron main process, then writes the NSIS
installer to `%TEMP%\df-dmtoolkit-release`.

Before publishing a release:

- Verify `package.json` and `package-lock.json` have the intended version.
- Run `npm run test`, `npm run lint`, and `npm run build:electron`.
- Run `npm run dist:win` and attach the generated installer.
- Keep the legal notice and SRD attribution with any release notes or download page.
