import fs from "fs";
const cfg = JSON.parse(fs.readFileSync("audit/ssot-canonical-map.json","utf8"));
const content = JSON.parse(fs.readFileSync("audit/dups-content.json","utf8"));
let jscpd = {};
try {
  jscpd = JSON.parse(fs.readFileSync("audit/jscpd-report.json","utf8"));
} catch(e) {
  console.log("No jscpd report found, using empty");
}

const prefer = cfg.preferPaths.map(p=>new RegExp(p));
const rank = f => { for (let i=0;i<prefer.length;i++) if (prefer[i].test(f)) return i; return 999; };
const pickCanon = arr => arr.sort((a,b)=>rank(a)-rank(b)||a.length-b.length)[0];

const queue = [];
// 1) Seed known pairs
for (const p of cfg.pairs) queue.push({ type:"pair", source:p.source, target:p.target, reason:p.reason });

// 2) Add content-dup groups (choose canonical by rank)
for (const g of content) {
  if (g.files.some(f => f.includes('node_modules') || f.includes('.cache'))) continue; // Skip cache files
  const canon = pickCanon(g.files);
  for (const f of g.files) if (f !== canon) queue.push({ type:"content", source:f, target:canon, reason:"content-duplicate" });
}

// 3) Add jscpd near-clones (choose canonical by rank)
if (jscpd?.duplications) {
  for (const d of jscpd.duplications) {
    const files = (d.files||[]).map(x=>x.filename).filter(Boolean).filter(f => !f.includes('node_modules') && !f.includes('.cache'));
    if (files.length < 2) continue;
    const canon = pickCanon(files);
    for (const f of files) if (f !== canon) queue.push({ type:"ast", source:f, target:canon, reason:"ast-clone" });
  }
}

fs.writeFileSync("audit/dup-queue.json", JSON.stringify(queue, null, 2));
console.log("queue-size", queue.length);