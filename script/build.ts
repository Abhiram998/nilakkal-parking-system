import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// server deps to bundle (reduce cold start)
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error"
];

async function buildAll() {
  // clean dist
  await rm("dist", { recursive: true, force: true });

  /* ---------------- CLIENT BUILD ---------------- */
  console.log("building client...");

  await viteBuild({
    configFile: "vite.config.ts",
    mode: "production"
  });

  console.log("client build done");

  /* ---------------- SERVER BUILD ---------------- */
  console.log("building server...");

  const pkg = JSON.parse(await readFile("package.json", "utf-8"));

  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {})
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
    minify: true,
    external: externals,
    define: {
      "process.env.NODE_ENV": '"production"'
    },
    logLevel: "info"
  });

  console.log("server build done");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
