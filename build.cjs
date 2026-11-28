const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sourceDir = path.join(__dirname, "src");
const args = process.argv.slice(2);
const phaseOne = args.includes("--phase-one");
const standalone = args.includes("--standalone");
const output = args.find((argument) => !["--phase-one", "--standalone"].includes(argument));
const defaultFile = phaseOne ? "phase-1.html" : standalone ? "standalone.html" : "index.html";
const target = path.resolve(output || path.join(__dirname, defaultFile));
const read = (file) => fs.readFileSync(path.join(sourceDir, file), "utf8");
const sharedPhaseOneFlows = new Set([34, 39, 41]);
const scripts = [
  "scenarios.js", "partner-cards.js", "audit-01-17.js", "audit-18-36.js", "audit-37-50.js",
  "engine.js", "conversation.js",
];

function replaceOnce(html, token, value) {
  if (html.split(token).length !== 2) throw new Error("Expected exactly one template marker: " + token);
  return html.replace(token, () => value);
}

let html = read("conversation.html");
if (phaseOne) {
  html = replaceOnce(html, 'id="app"', 'id="app" data-phase-one');
  html = replaceOnce(html, '상담봇 델리 | SK매직', '상담봇 델리 | 1차 시나리오');
}
if (standalone) html = replaceOnce(html, 'id="app"', 'id="app" data-standalone');
const css = read("conversation.css").replace(/url\("concept-c\/([a-z-]+\.png)"\)/g, (_, file) => {
  const image = fs.readFileSync(path.join(sourceDir, "concept-c", file)).toString("base64");
  return `url("data:image/png;base64,${image}")`;
});
if (/<\/style\b/i.test(css)) throw new Error("Unexpected closing style tag");
html = replaceOnce(html, '  <link rel="stylesheet" href="conversation.css">', `  <style>\n${css.trimEnd()}\n  </style>`);
for (const file of scripts) {
  let script = read(file);
  if (phaseOne && file === "scenarios.js") {
    const window = {};
    vm.runInNewContext(script, { window }, { timeout: 1000 });
    const included = window.SKIX_SCENARIOS.filter(({ phase, no }) => phase === "1차" || sharedPhaseOneFlows.has(no));
    script = "window.SKIX_SCENARIOS = " + JSON.stringify(included).replace(/</g, "\\u003c") + ";";
  }
  if (/<\/script\b/i.test(script)) throw new Error("Unexpected closing script tag in " + file);
  html = replaceOnce(html, `  <script src="${file}"></script>`, `  <script>\n${script.trimEnd()}\n  </script>`);
}

const logo = fs.readFileSync(path.join(sourceDir, "sk-magic-logo.png")).toString("base64");
html = replaceOnce(html, 'src="sk-magic-logo.png"', `src="data:image/png;base64,${logo}"`);
fs.writeFileSync(target, html, "utf8");
console.log(`Built ${target}`);
