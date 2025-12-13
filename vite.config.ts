import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
  root: "client",

  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
    },
  },

  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
  },

  server: {
    port: 5000,
  },
});
