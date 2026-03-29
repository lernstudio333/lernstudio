# Deploy Pipeline

## Command

```bash
npm run push          # full build + deploy to GAS
npm run build         # build only (no clasp push)
npm run test          # run Vitest unit tests
```

All commands must be run from `gdoc-sidebar/`.

---

## Pipeline steps (`npm run push`)

```
rimraf build/ tmp/
    ↓
node scripts/flatten-all.js
    ↓
tsc -p tsconfig.build.json
    ↓
clasp push --force
```

### 1. Clean (`rimraf build/ tmp/`)
Wipes both output directories before every build to prevent stale files.

### 2. Flatten (`scripts/flatten-all.js`)
Google Apps Script does not support subdirectories. This script walks `src/` and routes files:

| Source file | Destination | Transform |
|---|---|---|
| `*.ts` (except `*.test.ts`) | `tmp/flatname.ts` | `export ` keywords stripped (GAS needs plain globals) |
| `*.test.ts` | skipped | Vitest only — not deployed |
| `*.html`, `*.js`, `*.json` | `build/flatname.*` | Copied as-is |
| `appsscript.json` | `build/appsscript.json` | Copied without prefix (clasp requires it at root) |

**Flat naming:** `harvester/api.ts` → `harvester_api.ts` (folder separator becomes `_`, all lowercase).

### 3. Compile (`tsc -p tsconfig.build.json`)
Compiles `tmp/*.ts` → `build/*.js`. Uses a separate tsconfig that targets GAS's ES5/ES2019 environment.

### 4. Push (`clasp push --force`)
Uploads the entire `build/` directory to the bound Google Apps Script project. `--force` overwrites without interactive confirmation.

---

## Why `export` is stripped

`src/` uses `export` so Vitest can import functions as ES modules for unit testing. GAS runs in `module: "None"` mode where all declarations are plain globals — `export` would be a syntax error. `flatten-all.js` strips it with a regex before compilation.

---

## Adding a new source file

1. Create `src/subfolder/myfile.ts` with `export function ...` as normal
2. It will be automatically picked up by `flatten-all.js` → compiled as `build/subfolder_myfile.js`
3. All functions are globally available in GAS — no import needed in other files

## Adding a new test file

1. Create `src/subfolder/myfile.test.ts`
2. Import with `import { myFn } from './myfile'`
3. `flatten-all.js` skips `*.test.ts` — it will never be deployed to GAS
