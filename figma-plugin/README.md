# Rasterune for Figma

Rasterune for Figma exports the current selection from Figma, converts it to WebP or AVIF, and downloads the result with your chosen quality and effort settings.

## Build

From the repo root:

```powershell
npm install
npm run build:figma
```

## Load in Figma

1. Open Figma Desktop or Figma in the browser
2. Go to `Plugins` -> `Development` -> `Import plugin from manifest...`
3. Select [manifest.json](/c:/Users/Developer/Desktop/squoosh%20windows/figma-plugin/manifest.json)
4. Run `Rasterune for Figma`

## Current flow

- Reads the current selection
- Exports each selected layer as PNG through the Figma Plugin API
- Converts it in the plugin UI using Rasterune's browser conversion layer
- Downloads the final WebP or AVIF asset

## Notes

- This plugin does not depend on Chrome extension APIs
- It does not hook into Figma's native browser save action
- It is designed as the maintainable path for Figma-specific export workflows
