// Decorate sanitized Markdown nodes, preserving rich content inside each entry.
export function decorateIndex(content) {
  if (!content) return 0;
  if (content.firstElementChild?.tagName === "H1")
    content.firstElementChild.remove();
  content.querySelectorAll("h2").forEach((heading, index) => {
    heading.classList.add("index-section-heading");
    heading.setAttribute(
      "data-section-number",
      String(index + 1).padStart(2, "0"),
    );
  });
  for (const list of content.children) {
    if (!["UL", "OL"].includes(list.tagName)) continue;
    [...list.children].forEach((item, index) => {
      if (
        !item.querySelector("a[href]") ||
        item.querySelector(".index-entry-content")
      )
        return;
      list.classList.add("index-link-list");
      item.classList.add("index-entry");
      const body = document.createElement("div");
      body.className = "index-entry-content";
      while (item.firstChild) body.appendChild(item.firstChild);
      const number = document.createElement("span");
      number.className = "index-entry-number";
      number.textContent = String(index + 1).padStart(2, "0");
      number.setAttribute("aria-hidden", "true");
      const arrow = document.createElement("span");
      arrow.className = "index-entry-arrow";
      arrow.textContent = "↗";
      arrow.setAttribute("aria-hidden", "true");
      item.append(number, body, arrow);
    });
  }
  return content.querySelectorAll("a[href]").length;
}
