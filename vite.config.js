/*
export default {
  build: {
    sourcemap: true,
    target: 'esnext',
  }
}
*/


import { defineConfig } from "vite";

export default defineConfig({
  root: "./",
  assetsInclude: ["./images/*.*", "./data/*.*"],
  build: {
    emptyOutDir: true,
    outDir: "./dist",
    target: 'esnext',
    /* rollupOptions: {
      output: {
        assetFileNames: (asset) => {
          if (
            ['.jpg', '.png', '.svg', '.avif', '.webp'].some((ext) =>
              asset.name?.endsWith(ext),
            )
          ) {
            return 'images/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';  // for other assets like fonts and audios etc.
        },
      },
    } */
  }
});

