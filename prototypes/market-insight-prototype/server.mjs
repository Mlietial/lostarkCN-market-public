import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const prototypeRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(prototypeRoot, "../..");
const port = Number(process.env.PORT || 4173);
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

process.chdir(repositoryRoot);

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);
    let relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    if (!relativePath) relativePath = "index.html";
    let targetPath = path.resolve(repositoryRoot, relativePath);
    if (!targetPath.startsWith(repositoryRoot + path.sep)) throw new Error("invalid path");
    const targetStat = await stat(targetPath);
    if (targetStat.isDirectory()) targetPath = path.join(targetPath, "index.html");
    const body = await readFile(targetPath);
    response.writeHead(200, { "Content-Type": mimeTypes[path.extname(targetPath).toLowerCase()] || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Prototype: http://127.0.0.1:${port}/prototypes/market-insight-prototype/`);
});
