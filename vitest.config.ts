import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Enable file-level parallelism but disable test-level concurrency
    fileParallelism: true,
    // Use forks pool instead of threads to support process.chdir()
    pool: "forks",
    poolOptions: {
      forks: {
        // Use available CPU cores, but cap at reasonable limit
        maxForks: 32,
        minForks: 16,
      },
    },
    // Disable concurrent execution within test files to avoid race conditions
    sequence: {
      concurrent: false,
    },
    // Exclude common directories that may contain dependency tests or build artifacts
    // This prevents tests shipped inside node_modules from being executed
    // and keeps coverage/build folders out of test discovery.
    exclude: ["**/node_modules/**", "**/dist/**", "**/coverage/**"],
  },
});
