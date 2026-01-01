import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'editor-vendor': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-image',
            '@tiptap/extension-link',
            '@tiptap/extension-placeholder',
            '@tiptap/extension-table',
            '@tiptap/extension-code-block-lowlight',
            'tippy.js'
          ],
          'ui-vendor': ['lucide-react', 'katex']
        }
      }
    }
  }
})
