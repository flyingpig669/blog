import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "content");
const manifestPath = path.join(contentDir, "manifest.json");
const ignoredNames = new Set([".DS_Store", "manifest.json"]);

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(dir, baseDir = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredNames.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(absolute, baseDir)));
    } else {
      files.push(path.relative(baseDir, absolute).replaceAll(path.sep, "/"));
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

const entries = await fs.readdir(contentDir, { withFileTypes: true });
const notes = [];

for (const entry of entries) {
  if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

  const noteDir = path.join(contentDir, entry.name);
  const markdownPath = path.join(noteDir, "index.md");
  if (!(await exists(markdownPath))) continue;

  const attachments = (await listFiles(noteDir))
    .filter((file) => file !== "index.md")
    .map((file) => `content/${entry.name}/${file}`);

  notes.push({
    slug: entry.name,
    path: `content/${entry.name}/index.md`,
    attachments,
  });
}

notes.sort((a, b) => a.slug.localeCompare(b.slug));

await fs.writeFile(
  manifestPath,
  `${JSON.stringify({ notes }, null, 2)}\n`,
  "utf8",
);

console.log(`Generated content/manifest.json with ${notes.length} notes.`);
