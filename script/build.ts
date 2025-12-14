import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";
import path from "path";

const allowlist = [
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-session",
  "memorystore",
  "passport",
  "passport-local",
  "pg",
  "ws",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  // Clean dist
  await rm("dist", { recursive: true, force: true });

  /* ===============================
     ✅ BUILD CLIENT (IMPORTANT FIX)
     =============================== */
  console.log("building client...");
  await viteBuild({
    root: "client",
    build: {
      outDir: "../dist/client",
      emptyOutDir: true,
    },
  });
  console.log("client build done");

  /* ===============================
     BUILD SERVER
     =============================== */
  console.log("building server...");

  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];

  const externals = allDeps.filter(
    (dep) => !allowlist.includes(dep)
  );

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",

    define: {
      "process.env.NODE_ENV": '"production"',
    },

    alias: {
      "@shared": path.resolve("shared"),
    },

    external: externals,
    minify: true,
    sourcemap: false,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
