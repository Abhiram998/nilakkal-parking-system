import path from "path";
import express from "express";

export function serveStatic(app: express.Express) {
  const publicPath = path.join(process.cwd(), "dist/client");
  app.use(express.static(publicPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });
}
