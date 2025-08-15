import { Project, SyntaxKind, Node, ExportedDeclarations } from "ts-morph";
import fs from "fs"; import path from "path";
const queue = JSON.parse(fs.readFileSync("audit/dup-queue.json","utf8"));
const project = new Project({ tsConfigFilePath: "tsconfig.json" });
project.addSourceFilesAtPaths(["**/*.{ts,tsx}", "!node_modules/**", "!dist/**", "!build/**"]);

function norm(p:string){ return p.replace(/\\/g,"/"); }
function exists(p:string){ try{ fs.accessSync(p); return true; } catch { return false; } }

function ensureLoaded(p:string){
  const sf = project.getSourceFile(p) || project.addSourceFileAtPathIfExists(p);
  return sf || null;
}

function exportedNames(sf:any): Set<string> {
  const names = new Set<string>();
  if (!sf) return names;
  sf.getExportedDeclarations().forEach((arr:ExportedDeclarations[], name:string) => names.add(name));
  return names;
}

function copyMissingExports(sourceSf:any, targetSf:any, log:any){
  if(!sourceSf || !targetSf) return;
  const targetNames = exportedNames(targetSf);
  sourceSf.getExportedDeclarations().forEach((decls: ExportedDeclarations[], name: string) => {
    if (targetNames.has(name)) {
      // conflict: keep target, log
      log.conflicts.push({ name, kind: decls[0]?.getKindName?.(), file: sourceSf.getFilePath() });
      return;
    }
    // append minimal text of declaration
    const first = decls[0];
    if (!first) return;
    const text = first.getText();
    const appended = `\n// [MERGED FROM] ${norm(sourceSf.getFilePath())}\n${text}\n`;
    targetSf.insertText(targetSf.getEnd(), appended);
    log.copied.push({ name, from: norm(sourceSf.getFilePath()) });
  });
}

function rewriteImports(fromPath:string, toPath:string){
  for(const sf of project.getSourceFiles()){
    let changed = false;
    for(const imp of sf.getImportDeclarations()){
      const spec = norm(imp.getModuleSpecifierValue());
      // Match by exact or filename tail
      const fromFile = norm(fromPath).replace(/^.*\//,"");
      if (spec.endsWith(norm(fromPath)) || spec.endsWith(fromFile)) {
        const rel = norm(path.relative(path.dirname(norm(sf.getFilePath())), norm(toPath)));
        imp.setModuleSpecifier(rel.startsWith(".") ? rel : "./"+rel);
        changed = true;
      }
    }
    if (changed) sf.saveSync();
  }
}

const logPath = "audit/dup-merge-log.jsonl";
if (exists(logPath)) fs.unlinkSync(logPath);

let processed = 0;
for (const item of queue) {
  const { source, target, reason } = item;
  if (!source || !target) continue;
  if (norm(source) === norm(target)) continue;
  if (!exists(source)) continue;
  if (!exists(target)) {
    // If target missing (unexpected), skip but note.
    fs.appendFileSync(logPath, JSON.stringify({ action:"skip-target-missing", source, target, reason })+"\n");
    continue;
  }
  const sSf = ensureLoaded(source), tSf = ensureLoaded(target);
  const log = { action:"merge", source, target, reason, copied:[], conflicts:[] };

  try {
    copyMissingExports(sSf, tSf, log);
    tSf?.saveSync();

    rewriteImports(source, target);

    // remove source file
    fs.rmSync(source, { force:true });
    fs.appendFileSync(logPath, JSON.stringify(log)+"\n");
    processed++;

    if (processed % 10 === 0) {
      // checkpoint compile (best-effort)
      try { require("child_process").execSync("npx tsc --noEmit", { stdio:"inherit" }); } catch(e){}
    }
  } catch (e:any) {
    fs.appendFileSync(logPath, JSON.stringify({ action:"error", source, target, reason, error: e?.message })+"\n");
  }
}

// final project save
project.saveSync();
console.log("Processed items:", processed);