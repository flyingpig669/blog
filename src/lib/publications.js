import { safeUrl, store, tagHref } from "./content";
export function normalizeAuthors(value, selfNames = []) {
  const values = Array.isArray(value)
    ? value
    : String(value || "").split(/\s*,\s*/);
  return values.filter(Boolean).map((raw) => {
    const text = String(raw).trim();
    const marked = /^\*\*(.*)\*\*$/.exec(text);
    const name = (marked ? marked[1] : text).replace(/\*+$/, "").trim();
    return {
      name,
      self:
        !!marked ||
        /\*$/.test(text) ||
        selfNames.some((self) => self.toLowerCase() === name.toLowerCase()),
    };
  });
}
export function publicationLinks(publication) {
  const links = { ...(publication.links || {}) };
  for (const kind of [
    "pdf",
    "doi",
    "arxiv",
    "code",
    "slides",
    "dataset",
    "video",
    "poster",
    "site",
    "bib",
  ])
    if (!links[kind] && publication[kind]) links[kind] = publication[kind];
  const order = [
    "pdf",
    "doi",
    "arxiv",
    "code",
    "slides",
    "dataset",
    "poster",
    "video",
    "site",
    "bib",
  ];
  return [...new Set([...order, ...Object.keys(links)])]
    .map((kind) => [kind, links[kind]])
    .filter(([, value]) => !!value)
    .map(([kind, value]) => {
      let url = String(value);
      if (!/^(https?:|\/|#)/i.test(url)) {
        if (kind === "doi")
          url = "https://doi.org/" + url.replace(/^doi:\s*/i, "");
        if (kind === "arxiv")
          url = "https://arxiv.org/abs/" + url.replace(/^arxiv:\s*/i, "");
      }
      return { kind, href: safeUrl(url) };
    })
    .filter((link) => link.href);
}
export function publicationYear(publication) {
  const match = /\d{4}/.exec(
    String(publication.year || publication.date || ""),
  );
  return match ? Number(match[0]) : 0;
}
export function publicationCitations(publication) {
  const value = publication.citations ?? publication.cited;
  if (value == null || value === "") return null;
  const number = parseInt(String(value).replace(/[^\d]/g, ""), 10);
  return Number.isNaN(number) ? null : number;
}
export function resourceLink(kind, value) {
  if (kind === "tag") return tagHref(value);
  if (["post", "article", "blog", "note", "doc"].includes(kind)) {
    const reference = store.resolveLink(value);
    return reference ? "#" + reference.route : "";
  }
  return publicationLinks({ links: { [kind]: value } })[0]?.href || "";
}
