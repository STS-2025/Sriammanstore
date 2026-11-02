// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
// import netlify from '@netlify/vite-plugin-tanstack-start';netlify()

export default defineConfig({
  vite: {
    server: {
      // Use localhost because Firebase Auth authorizes hostnames, and 127.0.0.1
      // may not be present in the project's Authorized Domains list.
      host: "localhost",
      port: 5173,
    },
    build: {
      outDir: "dist",
    },
  },
  nitro: {
    output: {
      dir: "dist",
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
