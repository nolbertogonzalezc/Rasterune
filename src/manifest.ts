import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Rasterune',
  version: '1.0.0',
  description: 'Convert JPG and PNG images to WebP or AVIF directly from the page.',
  icons: {
    128: 'public/icons/rasterune_logo_128x128.png',
  },
  permissions: ['storage', 'downloads', 'scripting', 'activeTab'],
  host_permissions: ['<all_urls>'],
  action: {
    default_title: 'Rasterune',
    default_popup: 'src/popup/index.html',
    default_icon: {
      128: 'public/icons/rasterune_logo_128x128.png',
    },
  },
  options_page: 'src/options/index.html',
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],
  web_accessible_resources: [
    {
      resources: ['assets/*'],
      matches: ['<all_urls>'],
    },
  ],
});
