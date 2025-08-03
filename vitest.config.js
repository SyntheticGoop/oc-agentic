"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
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
    },
});
