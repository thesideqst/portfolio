import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Cloudflare Web Analytics: counts visits without cookies or tracking individual visitors.
// Added to the published build only, so local previews don't show up as visits. It follows
// page changes inside the app on its own, so there's nothing to call from the routes.
const CLOUDFLARE_ANALYTICS_TOKEN = '9d972ec0638041d3b2fcecd0d6d725ff'

const analytics = (): Plugin => ({
  name: 'cloudflare-web-analytics',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'script',
      attrs: {
        defer: true,
        src: 'https://static.cloudflareinsights.com/beacon.min.js',
        'data-cf-beacon': JSON.stringify({ token: CLOUDFLARE_ANALYTICS_TOKEN }),
      },
      injectTo: 'body',
    },
  ],
})

export default defineConfig({
  plugins: [react(), tailwindcss(), analytics()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
})
