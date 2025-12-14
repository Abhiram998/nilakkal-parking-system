import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();
const httpServer = createServer(app);

// --------------------
// Middleware
// --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const time = new Date().toLocaleTimeString("en-IN");
  console.log(`${time} [${source}] ${message}`);
}

// --------------------
// API Routes
// --------------------
(async () => {
  await registerRoutes(httpServer, app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  });

  // --------------------
  // PRODUCTION: Serve ONLY React build
  // --------------------
  if (process.env.NODE_ENV === "production") {
    const clientPath = path.join(process.cwd(), "dist", "client");

    app.use(express.static(clientPath));

    app.get("*", (_req, res) => {
      const indexFile = path.join(clientPath, "index.html");
      res.sendFile(indexFile);
    });
  }

  const port = Number(process.env.PORT) || 5000;
  httpServer.listen(port, "0.0.0.0", () => {
    log(`Server running on port ${port}`);
  });
})();
