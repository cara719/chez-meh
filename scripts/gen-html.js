// Turns src/app.html into a JS module so the page ships with the serverless build.
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
for (const [src, out, name] of [["src/app.html", "lib/appHtml.js", "appHtml"], ["src/login.html", "lib/loginHtml.js", "loginHtml"]]) {
  const html = fs.readFileSync(path.join(root, src), "utf8");
  fs.writeFileSync(path.join(root, out), "export const " + name + " = " + JSON.stringify(html) + ";\n");
}
