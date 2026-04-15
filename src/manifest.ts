import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Rasterune',
  version: '1.0.0',
  description: 'Convert JPG and PNG images to WebP or AVIF directly from the page.',
  permissions: ['storage', 'downloads', 'scripting', 'activeTab'],
  host_permissions: ['<all_urls>'],
  action: {
    default_title: 'Rasterune',
    default_popup: 'src/popup/index.html',
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
