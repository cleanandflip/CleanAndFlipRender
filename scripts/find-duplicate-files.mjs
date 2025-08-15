import fs from "fs";
import crypto from "crypto";
import fg from "fast-glob";
const include = ["**/*.{ts,tsx,js,jsx,css,scss,md,json}", "!node_modules/**", "!dist/**", "!build/**", "!coverage/**"];
const files = fg.sync(include, { dot: true });
const map = new Map();
for (const f of files) {
  const buf = fs.readFileSync(f), h = crypto.createHash("sha1").update(buf).digest("hex");
  (map.get(h) ?? map.set(h, []).get(h)).push(f);
}
const dups = [...map.entries()].filter(([,arr])=>arr.length>1).map(([h,arr])=>({hash:h,files:arr.sort()}));
fs.writeFileSync("audit/duplicate-files-content.json", JSON.stringify(dups,null,2));
console.log(`Content-duplicate groups: ${dups.length}`);