#!/usr/bin/env node
/**
 * flatten-all.js
 *
 * Walks src/, flattens folder/filename into folder_filename (all lowercase),
 * and routes files to:
 *   - tmp/  → TypeScript files (.ts)  — for tsc to compile into build/
 *   - build/ → everything else (HTML, JS, JSON)
 *
 * appsscript.json is always copied to build/ root (no prefix, clasp needs it there).
 */

const fs   = require('fs');
const path = require('path');

const srcRoot  = path.join(__dirname, '../src');
const tmpDir   = path.join(__dirname, '../tmp');
const buildDir = path.join(__dirname, '../build');

// Ensure output dirs exist
fs.mkdirSync(tmpDir,   { recursive: true });
fs.mkdirSync(buildDir, { recursive: true });

/**
 * Flatten a relative path like "harvester/api.ts" →  "harvester_api.ts"
 * All parts are lowercased.
 */
function flattenName(relPath) {
  const parts = relPath.split(path.sep);            // ['harvester', 'api.ts']
  return parts.map(p => p.toLowerCase()).join('_');  // 'harvester_api.ts'
}

/** Walk a directory recursively, yielding absolute file paths */
function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

let copied = 0;

for (const absPath of walk(srcRoot)) {
  const relPath = path.relative(srcRoot, absPath);  // e.g. "harvester/api.ts"
  const ext     = path.extname(absPath);            // e.g. ".ts"

  // appsscript.json → build/appsscript.json (no prefix, must be at root)
  if (relPath === 'appsscript.json') {
    fs.copyFileSync(absPath, path.join(buildDir, 'appsscript.json'));
    console.log(`  build/ ← ${relPath} (as appsscript.json)`);
    copied++;
    continue;
  }

  const flatName = flattenName(relPath);

  if (ext === '.ts') {
    // Skip test files — they are for Vitest only, not for GAS deployment
    if (relPath.endsWith('.test.ts')) {
      console.log(`  skip   ← ${relPath}  (test file)`);
      continue;
    }
    // Strip 'export ' keywords: GAS requires all declarations to be plain globals.
    // The export keyword is preserved in src/ for Vitest's ESM imports.
    const src = fs.readFileSync(absPath, 'utf8').replace(/^export /gm, '');
    fs.writeFileSync(path.join(tmpDir, flatName), src);
    console.log(`  tmp/   ← ${relPath}  →  ${flatName}`);
  } else {
    // HTML / JS / JSON → build/ directly
    fs.copyFileSync(absPath, path.join(buildDir, flatName));
    console.log(`  build/ ← ${relPath}  →  ${flatName}`);
  }
  copied++;
}

console.log(`\nFlatten complete: ${copied} files processed.`);
