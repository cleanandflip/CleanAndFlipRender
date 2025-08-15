import fs from "fs";
const plan = JSON.parse(fs.readFileSync("audit/consolidation-plan-conservative.json","utf8"));
const rm = (f)=>{ 
  try{ 
    fs.rmSync(f,{force:true, recursive: true}); 
    console.log("✓ Deleted:", f); 
  } catch(e){ 
    console.warn("Could not delete", f, e?.message); 
  } 
};

console.log("=== Purging Legacy Files ===");
(plan.replaceImportsThenDelete||[]).forEach((x)=>{ 
  if (x.canonical || x.reason==="legacy-banned") {
    rm(x.file); 
  }
});

console.log("\n=== Purging Safe Unused Files ===");
(plan.deleteSafe||[]).forEach((x)=> rm(x.file));