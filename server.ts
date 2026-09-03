import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import https from "https";
import http from "http";

// ServiceHub 后端地址配置
// 1. 本地联调默认: http://localhost:8080 (或者 http://127.0.0.1:8080)
// 2. 远程/内网穿透调试: 可通过环境变量 BACKEND_URL 指定，或直接在此切换
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";
// 备用内网穿透地址示例: "http://x62e626c.natappfree.cc"

// 从可信反向代理请求中提取客户端地址，避免把用户伪造的转发头传给后端
function resolveClientIp(req: express.Request) {
  const remoteAddr = req.socket.remoteAddress?.replace(/^::ffff:/, "") || "";
  const isLocalProxy = remoteAddr === "127.0.0.1" || remoteAddr === "::1" || remoteAddr === "0:0:0:0:0:0:0:1";
  if (!isLocalProxy) return remoteAddr;
  const forwarded = req.header("X-Forwarded-For")?.split(",", 1)[0]?.trim();
  return forwarded || req.header("X-Real-IP")?.trim() || remoteAddr;
}

async function startServer() {
  const app = express();
  const PORT = 3001;

  // Add JSON body parser for POST requests
  app.use(express.json());

  // 通用后端代理：透传状态码与统一响应包装
  const backendProxy = async (req: express.Request, res: express.Response, backendPath: string) => {
    try {
      const headers: Record<string, string> = {
        "X-Real-IP": resolveClientIp(req),
        "X-Forwarded-For": resolveClientIp(req),
      };
      if (req.method !== "GET") headers["Content-Type"] = "application/json";
      const backendRes = await fetch(`${BACKEND_URL}${backendPath}`, {
        method: req.method,
        headers,
        body: req.method === "GET" ? undefined : JSON.stringify(req.body || {}),
        signal: AbortSignal.timeout(10_000),
      });
      
      const contentType = backendRes.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Backend returned non-JSON response: ${backendRes.status} ${contentType}`);
      }
      
      const body = await backendRes.text();
      res.status(backendRes.status).type("application/json").send(body);
    } catch (err) {
      console.error(`Backend proxy error for ${backendPath}:`, err);
      res.status(502).json({ code: 1, data: null, message: "后端服务不可用" });
    }
  };

  // API Routes

  // 1. Get Profile（站点资料）
  app.get("/api/profile", (req, res) => backendProxy(req, res, "/api/hirongbaohub/profile"));

  // 2. Get Posts（已发布动态）
  app.get("/api/posts", (req, res) => {
    const qs = new URLSearchParams(req.query as Record<string, string>).toString();
    const querySuffix = qs ? `?${qs}` : '';
    backendProxy(req, res, `/api/hirongbaohub/posts${querySuffix}`);
  });

  // 分页动态代理，供首页无限滚动使用
  app.get("/api/posts/page", (req, res) => {
    const qs = new URLSearchParams(req.query as Record<string, string>).toString();
    backendProxy(req, res, `/api/hirongbaohub/posts/page${qs ? `?${qs}` : ''}`);
  });

  // 更新日志代理
  app.get("/api/releases", (req, res) => backendProxy(req, res, "/api/hirongbaohub/releases"));

  // 3. Like or Unlike a Post
  app.post("/api/posts/:id/like", (req, res) => backendProxy(req, res, `/api/hirongbaohub/posts/${req.params.id}/like`));

  // 4. Add a Comment to a Post
  app.post("/api/posts/:id/comments", (req, res) => backendProxy(req, res, `/api/hirongbaohub/posts/${req.params.id}/comments`));

  // 5. Heartbeat (Online Count)
  app.post("/api/heartbeat", (req, res) => backendProxy(req, res, "/api/hirongbaohub/heartbeat"));

  // API Route for proxying images to bypass CORS
  app.get("/api/proxy-image", (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send("URL is required");
    }

    try {
      const client = imageUrl.startsWith("https") ? https : http;
      client.get(imageUrl, (proxyRes) => {
        if (proxyRes.statusCode !== 200) {
          res.status(proxyRes.statusCode || 500).send("Failed to fetch image");
          return;
        }
        // Set CORS headers
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", proxyRes.headers["content-type"] || "image/jpeg");
        res.setHeader("Cache-Control", "public, max-age=31536000");
        proxyRes.pipe(res);
      }).on("error", (err) => {
        console.error("Proxy error:", err);
        res.status(500).send("Error fetching image");
      });
    } catch (err) {
      console.error("Server error:", err);
      res.status(500).send("Server Error");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
