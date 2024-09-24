import { defineConfig } from "vite";

export default defineConfig({
  root: "./",
  assetsInclude: ["./images/*.*", "./data/*.*"],
  build: {
    emptyOutDir: true,
    outDir: "./dist",
    target: "esnext",
    sourcemap: true, // Aktiviere die Generierung von Sourcemaps
    rollupOptions: {
      output: {
        assetFileNames: (asset) => {
          if (
            [".jpg", ".png", ".svg", ".avif", ".webp"].some((ext) =>
              asset.name?.endsWith(ext)
            )
          ) {
            return "images/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]"; // für andere Assets wie Schriftarten und Audio usw.
        },
      },
    },
  },
});
