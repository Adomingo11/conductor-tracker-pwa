import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  server: {
    port: 3000,
    host: '0.0.0.0', // Permite acceso desde la red local
    open: true,
    hmr: {
      overlay: true // Mostrar errores en overlay durante desarrollo
    },
    cors: true,
    strictPort: false // Permite usar puerto alternativo si 3000 está ocupado
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false, // Desactivar sourcemaps en producción para mejor performance
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['dexie', 'jspdf', 'chart.js']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['dexie', 'jspdf', 'chart.js', 'chartjs-plugin-zoom']
  }
})