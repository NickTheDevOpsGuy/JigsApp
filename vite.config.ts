import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/app'),
      '@assets': path.resolve(__dirname, './src/app/assets'),
      '@styles': path.resolve(__dirname, './src/app/styles'),
      '@screens': path.resolve(__dirname, './src/app/screens'),
      '@components': path.resolve(__dirname, './src/app/components'),
      '@providers': path.resolve(__dirname, './src/app/providers'),
      '@features': path.resolve(__dirname, './src/app/features'),
      '@utils': path.resolve(__dirname, './src/app/utils'),
      '@types': path.resolve(__dirname, './src/app/types'),
    },
  },
});