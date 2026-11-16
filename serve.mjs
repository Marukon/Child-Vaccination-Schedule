import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const host = "127.0.0.1";
const port = Number(process.argv[2] ?? 8731);
const files = new Map([
  ["index.html", "text/html; charset=utf-8"],
  ["styles.css", "text/css; charset=utf-8"],
  ...["data.js", "replacement.js", "planner.js", "app.js"].map((file) => [file, "text/javascript; charset=utf-8"]),
  ...["icon.svg", "calendar-art.svg"].map((file) => [file, "image/svg+xml"]),
  ["国家免疫规划疫苗儿童免疫程序及说明（2026年版）.pdf", "application/pdf"],
]);

createServer(async (req, res) => {
  try {
    const request = new URL(req.url, `http://${host}`);
    const file = decodeURIComponent(request.pathname.slice(1)) || "index.html";
    if (!files.has(file)) { res.writeHead(404).end(); return; }
    const body = await readFile(new URL(encodeURIComponent(file), import.meta.url));
    res.writeHead(200, { "Content-Type": files.get(file), "Cache-Control": "no-store" }).end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(port, host, () => console.log(`http://${host}:${port}/`));
