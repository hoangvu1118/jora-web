// Job descriptions come from Greenhouse as HTML (sometimes escaped twice).
// We never insert that HTML into the page. Instead we read it into simple blocks
// ({ type: "p" | "h", text } or { type: "list", items }) and React renders those as plain text.
// This keeps the page safe.

export function descriptionToBlocks(description) {
  if (!description) {
    return [];
  }
  let doc = new DOMParser().parseFromString(description, "text/html");
  // Escaped HTML ("&lt;p&gt;") turns into text that still looks like tags: parse once more.
  if (doc.body.children.length === 0 && doc.body.textContent.includes("<")) {
    doc = new DOMParser().parseFromString(doc.body.textContent, "text/html");
  }

  const blocks = [];
  const elements = doc.body.querySelectorAll("p, li, h1, h2, h3, h4");
  for (const element of elements) {
    const text = element.textContent.trim();
    if (text === "") {
      continue;
    }
    // A <p> inside an <li> is already counted by the <li>.
    if (element.tagName === "P" && element.closest("li")) {
      continue;
    }
    if (element.tagName === "LI") {
      addListItem(blocks, text);
    } else if (element.tagName === "P") {
      blocks.push({ type: "p", text: text });
    } else {
      blocks.push({ type: "h", text: text });
    }
  }

  // Plain text with no tags at all: one paragraph per line.
  if (blocks.length === 0) {
    const lines = doc.body.textContent.split("\n");
    for (const line of lines) {
      if (line.trim() !== "") {
        blocks.push({ type: "p", text: line.trim() });
      }
    }
  }
  return blocks;
}

// Bullet points that follow each other go into one list.
function addListItem(blocks, text) {
  const last = blocks[blocks.length - 1];
  if (last && last.type === "list") {
    last.items.push(text);
  } else {
    blocks.push({ type: "list", items: [text] });
  }
}
