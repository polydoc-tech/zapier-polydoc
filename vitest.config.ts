import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Live smoke tests in creates.test.ts hit the real sandbox API and stash
    // files; give them room and run files serially to respect the ~5 req/sec
    // sandbox rate limit.
    testTimeout: 60000,
    fileParallelism: false,
  },
});
