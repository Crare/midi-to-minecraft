import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@components': resolve(__dirname, 'src/components'),
      '@midi': resolve(__dirname, 'src/midi'),
      '@audio': resolve(__dirname, 'src/audio'),
      '@assets': resolve(__dirname, 'public/assets'),
      '@constants': resolve(__dirname, 'src/constants'),
      '@src': resolve(__dirname, 'src'),
    },
  },
});
