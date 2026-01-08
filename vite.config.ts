import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
    '@': path.resolve(__dirname, './src/app'),
    '@assets': path.resolve(__dirname, './src/app/assets'),
    '@components': path.resolve(__dirname, './src/app/components'),
    '@screens': path.resolve(__dirname, './src/app/screens'),
    '@puzzle': path.resolve(__dirname, './src/app/puzzle'),
    }
  }
});
