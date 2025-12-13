import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(async () => {
  const isRender =
    process.env.RENDER === "true" ||
    process.env.NODE_ENV === "production";

  const replitPlugins: any[] = [];

  if (!isRender) {
    try {
      const runtimeError = await import(
        "@replit/vite-plugin-runtime-error-modal"
      );
      const devBanner = await import(
        "@replit/vite-plugin-dev-banner"
      );

      replitPlugins.push(
        runtimeError.default(),
        devBanner.default()
      );
    } catch {
      // Replit plugins not available — ignore safely
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...replitPlugins
    ],
    server: {
      port: 5000
    }
  };
});
