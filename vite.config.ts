import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  // Keep the former Next.js public variable names working while Vite projects
  // conventionally use VITE_. Both prefixes are intentionally public.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'BUFFER_KEY', 'SECRET_KEY'],
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
