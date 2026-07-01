import { defineConfig } from 'vitest/config'  // Keep this for test config
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@mui/x-date-pickers',
      '@mui/x-date-pickers/AdapterDayjs',
      'dayjs',
    ],
  },
  server: {
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      overlay: true,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'dist/**',
        'e2e/**',
        'tests/**',
        'src/test/**',
        '**/*.config.*',
        '**/*.d.ts',
      ],
    },
  },
})