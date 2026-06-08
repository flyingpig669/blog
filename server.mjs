import crypto from "node:crypto";
import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateManifest } from "./scripts/generate-manifest.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const env = { ...(await loadEnv(path.join(root, ".env"))), ...process.env };
const config = {
  port: Number(env.BLOG_PORT || 4173),
  user: env.BLOG_ADMIN_USER || "admin",
  password: env.BLOG_ADMIN_PASSWORD || "change-this-password",
  secret: env.BLOG_SESSION_SECRET || "dev-secret-change-me",
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".csv": "text/csv; charset=utf-8",
  ".pdf": "application/pdf",
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === "/api/login" && req.method === "POST") {
      return handleLogin(req, res);
    }
    if (url.pathname === "/api/logout" && req.method === "POST") {
      return handleLogout(res);
    }
    if (url.pathname === "/api/session") {
      return sendJson(res, { authenticated: isAuthenticated(req) });
    }
    if (url.pathname === "/api/options") {
      if (!isAuthenticated(req)) return sendUnauthorized(res);
      return handleOptions(res);
    }
    if (url.pathname === "/api/notes" && req.method === "GET") {
      if (!isAuthenticated(req)) return sendUnauthorized(res);
      return handleListNotes(res);
    }
    if (url.pathname === "/api/notes" && req.method === "POST") {
      if (!isAuthenticated(req)) return sendUnauthorized(res);
      return handleSaveNote(req, res);
    }
    if (url.pathname === "/admin") {
      return serveFile(res, path.join(root, "admin.html"));
    }

    const requested = url.pathname === "/" ? "/index.html" : url.pathname;
    return serveFile(res, path.join(root, requested));
  } catch (error) {
    sendJson(res, { error: error.message }, 500);
  }
});

server.listen(config.port, () => {
  console.log(`Phase Space Notes running at http://localhost:${config.port}`);
  console.log(`Admin editor: http://localhost:${config.port}/admin`);
});

async function loadEnv(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return Object.fromEntries(
      raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
          const index = line.indexOf("=");
          if (index === -1) return [line, ""];
          return [line.slice(0, index), line.slice(index + 1)];
        }),
    );
  } catch {
    return {};
  }
}

function sign(value) {
  return crypto.createHmac("sha256", config.secret).update(value).digest("hex");
}

function createSession() {
  const payload = JSON.stringify({
    user: config.user,
    exp: Date.now() + 1000 * 60 * 60 * 12,
  });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function isAuthenticated(req) {
  const cookie = parseCookies(req.headers.cookie || "").blog_session;
  if (!cookie) return false;
  const [encoded, signature] = cookie.split(".");
  if (!encoded || signature !== sign(encoded)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return payload.user === config.user && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function parseCookies(cookieHeader) {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

async function handleLogin(req, res) {
  const body = await readJson(req);
  const userOk = body.username === config.user;
  const passwordOk = body.password === config.password;
  if (!userOk || !passwordOk) return sendJson(res, { error: "账号或密码错误" }, 401);

  res.setHeader(
    "Set-Cookie",
    `blog_session=${encodeURIComponent(createSession())}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200`,
  );
  return sendJson(res, { ok: true });
}

function handleLogout(res) {
  res.setHeader("Set-Cookie", "blog_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
  return sendJson(res, { ok: true });
}

async function handleOptions(res) {
  const notes = await readAllNotes();
  const unique = (values) => [...new Set(values.filter((value) => !isBlank(value)))].sort();
  return sendJson(res, {
    categories: unique(notes.flatMap((note) => note.categories)),
    tags: unique(notes.flatMap((note) => note.tags)),
    series: unique(notes.map((note) => note.series)),
  });
}

async function handleListNotes(res) {
  return sendJson(res, { notes: await readAllNotes() });
}

async function handleSaveNote(req, res) {
  const note = await readJson(req);
  const title = cleanText(note.title);
  if (isBlank(title)) return sendJson(res, { error: "标题不能为空" }, 400);

  const slug = slugify(note.slug || title);
  if (isBlank(slug)) return sendJson(res, { error: "无法生成 slug" }, 400);

  const noteDir = path.join(root, "content", slug);
  const attachmentDir = path.join(noteDir, "attachments");
  await fs.mkdir(attachmentDir, { recursive: true });

  const markdown = buildMarkdown({ ...note, title, slug });
  await fs.writeFile(path.join(noteDir, "index.md"), markdown, "utf8");
  const manifest = await generateManifest(root);

  return sendJson(res, {
    ok: true,
    slug,
    path: `content/${slug}/index.md`,
    manifestCount: manifest.notes.length,
  });
}

async function readAllNotes() {
  const manifestPath = path.join(root, "content", "manifest.json");
  let manifest;
  try {
    manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  } catch {
    manifest = (await generateManifest(root));
  }

  const notes = [];
  for (const entry of manifest.notes || []) {
    try {
      const markdown = await fs.readFile(path.join(root, entry.path), "utf8");
      const attrs = parseFrontMatter(markdown).attrs;
      notes.push({
        slug: entry.slug,
        path: entry.path,
        title: attrs.title || entry.slug,
        categories: normalizeList(attrs.categories, normalizeList(attrs.category)),
        tags: normalizeList(attrs.tags),
        series: cleanText(attrs.series),
        date: attrs.date || "",
      });
    } catch {
      // Skip broken note files so the editor can still open.
    }
  }
  return notes;
}

function buildMarkdown(note) {
  const categories = parseList(note.categories);
  const tags = parseList(note.tags);
  const frontMatter = [
    "---",
    `title: ${note.title}`,
    `date: ${cleanText(note.date) || new Date().toISOString().slice(0, 10)}`,
    `readTime: ${cleanText(note.readTime) || "5 分钟"}`,
    categories.length === 1
      ? `category: ${categories[0]}`
      : `categories: [${categories.join(", ")}]`,
    !isBlank(note.series) ? `series: ${cleanText(note.series)}` : "",
    !isBlank(note.series) && !isBlank(note.seriesOrder)
      ? `seriesOrder: ${Number(note.seriesOrder) || 1}`
      : "",
    tags.length ? `tags: [${tags.join(", ")}]` : "",
    !isBlank(note.status) ? `status: ${cleanText(note.status)}` : "",
    !isBlank(note.paper) ? `paper: ${cleanText(note.paper)}` : "",
    !isBlank(note.repo) ? `repo: ${cleanText(note.repo)}` : "",
    !isBlank(note.dataset) ? `dataset: ${cleanText(note.dataset)}` : "",
    `cover: ${cleanText(note.cover) || "attachments/cover.png"}`,
    `excerpt: ${cleanText(note.excerpt) || "这篇文章还没有摘要。"}`,
    "---",
  ].filter((line) => line !== "");

  return `${frontMatter.join("\n")}\n\n${note.body || ""}\n`;
}

function parseFrontMatter(markdown) {
  if (!markdown.startsWith("---")) return { attrs: {}, body: markdown };
  const end = markdown.indexOf("\n---", 3);
  if (end === -1) return { attrs: {}, body: markdown };
  const attrs = {};
  markdown
    .slice(3, end)
    .trim()
    .split(/\r?\n/)
    .forEach((line) => {
      const match = line.match(/^([\w-]+):\s*(.*)$/);
      if (!match) return;
      attrs[match[1]] = parseValue(match[2]);
    });
  return { attrs, body: markdown.slice(end + 4).trim() };
}

function parseValue(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return trimmed;
}

function normalizeList(value, fallback = []) {
  if (Array.isArray(value)) return value.map(cleanText).filter((item) => !isBlank(item));
  if (!isBlank(value)) return [cleanText(value)];
  return fallback;
}

function parseList(value) {
  if (Array.isArray(value)) return value.map(cleanText).filter((item) => !isBlank(item));
  return String(value || "")
    .split(",")
    .map(cleanText)
    .filter((item) => !isBlank(item));
}

function cleanText(value = "") {
  return String(value).trim();
}

function isBlank(value) {
  return cleanText(value).length === 0;
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function serveFile(res, absolutePath) {
  const normalized = path.normalize(absolutePath);
  if (!normalized.startsWith(root)) return sendText(res, "Forbidden", 403);

  try {
    const stat = await fs.stat(normalized);
    if (stat.isDirectory()) return serveFile(res, path.join(normalized, "index.html"));
    const ext = path.extname(normalized).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(await fs.readFile(normalized));
  } catch {
    sendText(res, "Not found", 404);
  }
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function sendText(res, text, status = 200) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function sendUnauthorized(res) {
  return sendJson(res, { error: "需要登录" }, 401);
}
