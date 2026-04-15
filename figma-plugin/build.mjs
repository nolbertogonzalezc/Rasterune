import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

async function ensureUiHtml() {
  const template = await readFile(path.join(srcDir, 'ui', 'index.html'), 'utf8');
  const html = template.replace('./main.ts', './ui.js');
  await writeFile(path.join(distDir, 'ui.html'), html, 'utf8');
}

async function createInlineUiHtml() {
  const html = await readFile(path.join(distDir, 'ui.html'), 'utf8');
  const css = await readFile(path.join(distDir, 'ui.css'), 'utf8');
  const js = await readFile(path.join(distDir, 'ui.js'), 'utf8');

  return html
    .replace('<link rel="stylesheet" href="./ui.css" />', `<style>${css}</style>`)
    .replace('<script defer src="./ui.js"></script>', `<script>${js}</script>`);
}

async function main() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  await build({
    entryPoints: [path.join(srcDir, 'ui', 'main.ts')],
    outfile: path.join(distDir, 'ui.js'),
    bundle: true,
    format: 'iife',
    target: 'es2015',
    platform: 'browser',
    legalComments: 'none',
    loader: {
      '.png': 'dataurl',
      '.webp': 'dataurl',
    },
  });

  await cp(path.join(srcDir, 'ui', 'ui.css'), path.join(distDir, 'ui.css'));
  await ensureUiHtml();

  const inlineHtml = await createInlineUiHtml();

  await build({
    entryPoints: [path.join(srcDir, 'code.ts')],
    outfile: path.join(distDir, 'code.js'),
    bundle: true,
    format: 'iife',
    target: 'es2015',
    platform: 'browser',
    legalComments: 'none',
    banner: {
      js: `var RASTERUNE_INLINE_UI_HTML = ${JSON.stringify(inlineHtml)};`,
    },
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
