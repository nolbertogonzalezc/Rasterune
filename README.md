# Rasterune

Rasterune is a lightweight Chrome extension for quick and simple image optimization directly in the browser. It keeps the UI minimal while organizing the internals around a modular MV3 architecture with centralized state, clean messaging, and an isolated conversion adapter.

Rasterune is inspired by the open-source spirit of Squoosh, but it is an independent project and is not affiliated with Google.

## What it does

- Detects compatible `jpg`, `jpeg`, and `png` images on the current page
- Shows a lightweight on-demand action over supported images
- Converts images to `WebP` or `AVIF`
- Persists global settings with `chrome.storage.local`
- Lets you enable or disable the extension instantly from the popup
- Supports English, Spanish, French, and German

## Project structure

- `src/background/`: state owner, message routing, tab sync, network fetch
- `src/content/`: DOM integration, image scanning, overlay UI, conversion flow
- `src/popup/`: minimal extension popup
- `src/options/`: settings UI for format, quality, effort, language, and debug
- `src/engine/`: conversion contracts and adapter boundary
- `src/shared/`: state types, messaging, i18n, logging, utilities
- `legacy/`: Node reference script preserved from the original local workflow

## Local development

Install dependencies:

```powershell
npm install
```

Run a production build:

```powershell
npm run build
```

Type-check the project:

```powershell
npm run typecheck
```

## Load the extension in Chrome

1. Run `npm run build`
2. Open `chrome://extensions`
3. Enable `Developer mode`
4. Click `Load unpacked`
5. Select the `dist/` folder

## Legacy script

The old local folder-based conversion flow is still available:

```powershell
node squoosh.js
```

That script proxies to `legacy/squoosh-node-reference.js` and keeps the original `old/` -> `new/` workflow intact.
