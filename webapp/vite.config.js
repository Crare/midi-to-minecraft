import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { resolve } from 'path';

export default defineConfig({
  base: '/midi-to-minecraft/',
  plugins: [react()],
  resolve: {
    alias: {
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@components': resolve(__dirname, 'src/components'),
      '@midi': resolve(__dirname, 'src/midi'),
      '@audio': resolve(__dirname, 'src/audio'),
      '@assets': resolve(__dirname, 'public/assets'),
    },
  },
});
