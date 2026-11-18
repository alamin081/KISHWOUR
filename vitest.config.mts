import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // `server-only` throws outside React Server Components; stub it in unit tests.
    alias: {
      "server-only": new URL("./src/test/server-only-stub.ts", import.meta.url).pathname,
    },
  },
});
