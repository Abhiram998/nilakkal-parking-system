import "dotenv/config";

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// --------------------
// Middleware
// --------------------
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Request logger (API only)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: any;

  const originalResJson = res.json.bind(res);
  res.json = (body) => {
    capturedJsonResponse = body;
    return originalResJson(body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(
        `${req.method} ${path} ${res.statusCode} in ${duration}ms :: ${
          capturedJsonResponse ? JSON.stringify(capturedJsonResponse) : ""
        }`
      );
    }
  });

  next();
});

(async () => {
  // --------------------
  // API routes
  // --------------------
  await registerRoutes(httpServer, app);

  // --------------------
  // Error handler
  // --------------------
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ success: false, message });
    console.error(err);
  });

  // --------------------
  // PRODUCTION: Serve React (Vite build)
  // --------------------
  if (process.env.NODE_ENV === "production") {
    const clientDistPath = path.resolve("dist/client");

    // Serve static assets
    app.use(express.static(clientDistPath));

    // SPA fallback → VERY IMPORTANT
    app.get("*", (_req, res) => {
      const indexHtml = path.join(clientDistPath, "index.html");
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(500).send("Client build not found");
      }
    });
  } 
  // --------------------
  // DEV: Vite dev server
  // --------------------
  else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = Number(process.env.PORT) || 5000;

  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
