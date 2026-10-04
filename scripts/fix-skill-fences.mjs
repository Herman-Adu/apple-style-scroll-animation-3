import fs from "fs";
import path from "path";

const base = path.resolve(process.cwd(), ".agents/skills");

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.isFile() && e.name === "SKILL.md") processFile(full);
  }
}

function processFile(file) {
  const raw = fs.readFileSync(file, "utf8");
  const lines = raw.split(/\r?\n/);

  // remove leading empty lines
  while (lines.length > 0 && lines[0].trim() === "") lines.shift();
  if (lines.length === 0) return;

  // if frontmatter already at top, ensure closing marker exists
  if (lines[0].trim() === "---") {
    const closing = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
    if (closing === -1) {
      // find first heading or blank line to mark end of frontmatter
      let contentIndex = lines.findIndex(
        (l, i) => i > 0 && l.trim().startsWith("#"),
      );
      if (contentIndex === -1)
        contentIndex = lines.findIndex((l, i) => i > 0 && l.trim() === "");
      if (contentIndex === -1) contentIndex = lines.length;
      lines.splice(contentIndex, 0, "---");
      fs.writeFileSync(file, lines.join("\n"), "utf8");
      console.log(`Inserted closing frontmatter marker in ${file}`);
    } else {
      console.log(`Skipping ${file}: frontmatter OK`);
    }
    return;
  }

  // if first non-empty line looks like name: -> add opening and closing markers
  if (lines[0].trim().startsWith("name:")) {
    lines.splice(0, 0, "---");
    // find first heading or blank line to end frontmatter
    let contentIndex = lines.findIndex(
      (l, i) => i > 0 && l.trim().startsWith("#"),
    );
    if (contentIndex === -1)
      contentIndex = lines.findIndex((l, i) => i > 0 && l.trim() === "");
    if (contentIndex === -1) contentIndex = lines.length;
    lines.splice(contentIndex, 0, "---");
    fs.writeFileSync(file, lines.join("\n"), "utf8");
    console.log(`Repaired frontmatter in ${file}`);
    return;
  }

  console.log(`Skipping ${file}: no action needed`);
}

walk(base);
console.log("Done");
