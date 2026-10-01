import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Serves the /api/* Vercel functions during `npm run dev`, so you don't need the
// Vercel CLI locally. In production, Vercel runs the same files natively.
function localApi() {
  return {
    name: "local-vercel-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();
        const route = req.url.split("?")[0].replace(/^\/api\//, "").replace(/[^a-z0-9-]/gi, "");
        let mod;
        try {
          mod = await server.ssrLoadModule(`/api/${route}.js`);
        } catch {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ error: `No API route /api/${route}` }));
        }

        let raw = "";
        for await (const chunk of req) raw += chunk;
        try {
          req.body = raw ? JSON.parse(raw) : {};
        } catch {
          req.body = raw;
        }

        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (data) => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
          return res;
        };

        try {
          await mod.default(req, res);
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Make server-only secrets (GROQ_API_KEY etc.) from .env available to the API handlers.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
    plugins: [react(), tailwindcss(), localApi()],
  };
});
