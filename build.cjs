const fs = require("node:fs");
const path = require("node:path");

const sourceDir = path.join(__dirname, "src");
const target = path.resolve(process.argv[2] || path.join(__dirname, "index.html"));
const read = (file) => fs.readFileSync(path.join(sourceDir, file), "utf8");
const scripts = [
  "scenarios.js", "partner-cards.js", "audit-01-17.js", "audit-18-36.js", "audit-37-50.js",
  "engine.js", "conversation.js",
];

function replaceOnce(html, token, value) {
  if (html.split(token).length !== 2) throw new Error("Expected exactly one template marker: " + token);
  return html.replace(token, () => value);
}

let html = read("conversation.html");
const css = read("conversation.css").replace(/url\("concept-c\/([a-z-]+\.png)"\)/g, (_, file) => {
  const image = fs.readFileSync(path.join(sourceDir, "concept-c", file)).toString("base64");
  return `url("data:image/png;base64,${image}")`;
});
if (/<\/style\b/i.test(css)) throw new Error("Unexpected closing style tag");
html = replaceOnce(html, '  <link rel="stylesheet" href="conversation.css">', `  <style>\n${css.trimEnd()}\n  </style>`);
for (const file of scripts) {
  const script = read(file);
  if (/<\/script\b/i.test(script)) throw new Error("Unexpected closing script tag in " + file);
  html = replaceOnce(html, `  <script src="${file}"></script>`, `  <script>\n${script.trimEnd()}\n  </script>`);
}

const logo = fs.readFileSync(path.join(sourceDir, "sk-magic-logo.png")).toString("base64");
html = replaceOnce(html, 'src="sk-magic-logo.png"', `src="data:image/png;base64,${logo}"`);
fs.writeFileSync(target, html, "utf8");
console.log(`Built ${target}`);
