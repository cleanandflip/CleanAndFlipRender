import fs from "fs";
const allowBan = JSON.parse(fs.readFileSync("audit/ssot-allow-ban.json","utf8"));
const dupContent = JSON.parse(fs.readFileSync("audit/duplicate-files-content.json","utf8"));
let jscpd = {};
try {
  jscpd = JSON.parse(fs.readFileSync("report/jscpd-report.json","utf8"));
} catch (e) {
  console.log("No jscpd report found");
}
let knip = {};
try {
  knip = JSON.parse(fs.readFileSync("audit/knip.json","utf8"));
} catch (e) {
  console.log("No knip report found");
}

const prefer = allowBan.preferPaths.map(p=>new RegExp(p));
const canonicalSets = new Set([].concat(...Object.values(allowBan.canonical)));
const actions = { replaceImportsThenDelete: [], deleteSafe: [], reviewManual: [] };

const rank = f => {
  for (let i=0;i<prefer.length;i++) if (prefer[i].test(f)) return i;
  return 999;
};
const pickCanonical = files => files.sort((a,b)=> rank(a)-rank(b) || a.length-b.length)[0];

// Filter out cache/node_modules duplicates and focus on actual source files
const relevantDups = dupContent.filter(grp => 
  grp.files.some(f => !f.includes('node_modules') && !f.includes('.cache'))
);

// content-duplicates
for (const grp of relevantDups) {
  const sourceFiles = grp.files.filter(f => !f.includes('node_modules') && !f.includes('.cache'));
  if (sourceFiles.length > 1) {
    const canon = pickCanonical(sourceFiles);
    sourceFiles.filter(f=>f!==canon).forEach(f => actions.replaceImportsThenDelete.push({file:f, canonical:canon, reason:"content-duplicate"}));
  }
}

// AST clones (may need manual in some cases)
if (jscpd?.duplications) {
  for (const d of jscpd.duplications) {
    const files = (d.files||[]).map(x=>x.filename).filter(f => !f.includes('node_modules') && !f.includes('.cache'));
    if (files.length>=2) {
      const canon = pickCanonical(files);
      files.filter(f=>f!==canon).forEach(f => actions.replaceImportsThenDelete.push({file:f, canonical:canon, reason:"ast-clone"}));
    }
  }
}

// knip unused files (not in canonical set)
if (knip && knip.files) {
  for (const f of knip.files) {
    if (!canonicalSets.has(f) && !f.includes('node_modules') && !f.includes('.cache')) {
      actions.deleteSafe.push({file:f, reason:"knip-unused"});
    }
  }
}

// legacy banlist
allowBan.legacyBan.forEach(p => actions.replaceImportsThenDelete.push({file:p, canonical:null, reason:"legacy-banned"}));

fs.writeFileSync("audit/consolidation-plan.json", JSON.stringify(actions,null,2));
console.log(`Plan -> audit/consolidation-plan.json`);
console.log(`Actions: ${actions.replaceImportsThenDelete.length} replace/delete, ${actions.deleteSafe.length} safe deletes, ${actions.reviewManual.length} manual review`);