import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "pages",
  publicDir: "../public",
  plugins: [react()],
  base: "/",
  build: {
    outDir: "../docs",
    emptyOutDir: true,
  },
});
