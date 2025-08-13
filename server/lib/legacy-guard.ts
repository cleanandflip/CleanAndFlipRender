export function LEGACY_KILL_SWITCH(moduleName: string): never {
  const msg = `[FATAL] Legacy module imported: ${moduleName}. Remove all references.`;
  console.error(msg);
  throw new Error(msg);
}
