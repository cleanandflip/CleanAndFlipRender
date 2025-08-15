import fs from "fs"; import crypto from "crypto"; import fg from "fast-glob";
const files = fg.sync(["**/*.{ts,tsx,js,jsx,json,md,css,scss}", "!node_modules/**","!dist/**","!build/**","!coverage/**"], { dot:true });
const map = new Map();
for (const f of files) {
  const b = fs.readFileSync(f); const h = crypto.createHash("sha1").update(b).digest("hex");
  (map.get(h) ?? map.set(h, []).get(h)).push(f);
}
const groups = [...map.entries()].filter(([,arr])=>arr.length>1).map(([hash, arr])=>({hash, files: arr.sort()}));
fs.writeFileSync("audit/dups-content.json", JSON.stringify(groups, null, 2));
console.log("content-dup-groups", groups.length);