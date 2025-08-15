import { Project } from "ts-morph"; import fs from "fs";
const cfg = JSON.parse(fs.readFileSync("audit/ssot-canonical-map.json","utf8"));
const proj = new Project({ tsConfigFilePath: "tsconfig.json" });
proj.addSourceFilesAtPaths(["**/*.{ts,tsx}", "!node_modules/**","!dist/**","!build/**"]);
for (const sf of proj.getSourceFiles()) {
  let t = sf.getText(), changed = false;
  for (const pat of cfg.forbiddenPatterns) {
    const re = new RegExp(pat, "g");
    if (re.test(t)) { t = t.replace(re, (m)=>`/* SSOT-FORBIDDEN ${pat} */ ${m}`); changed = true; }
  }
  if (changed) { sf.replaceWithText(t); sf.saveSync(); }
}
console.log("Annotated forbidden occurrences.");