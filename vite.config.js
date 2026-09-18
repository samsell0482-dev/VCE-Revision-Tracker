import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins:[react()],
  base:'./',
  server:{port:5173,strictPort:true},
  build:{rollupOptions:{output:{manualChunks(id){
    if(id.includes('node_modules'))return 'vendor';
    if(id.endsWith('subjects.json'))return 'subjects';
  }}}}
});
