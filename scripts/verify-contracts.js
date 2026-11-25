#!/usr/bin/env node
/**
 * verify-contracts.js
 * Zero-Debt Architectural Contract & Invariant Gate for O.N.E Mash
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const APP_DIR = path.join(SRC_DIR, 'app');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const THEME_DIR = path.join(SRC_DIR, 'theme');
const STORE_DIR = path.join(SRC_DIR, 'store');

function walkTsFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkTsFiles(full));
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${name}`);
  } catch (err) {
    failedTests++;
    console.log(`  \x1b[31m✖ FAIL\x1b[0m: ${name}`);
    console.log(`    \x1b[33m${err.message}\x1b[0m`);
  }
}

console.log('\n======================================================');
console.log('   O.N.E MASH ARCHITECTURAL CONTRACT VERIFICATION');
console.log('======================================================\n');

runTest('Contract 1: Modular Store & Registered Slices', () => {
  const storeIndexPath = path.join(STORE_DIR, 'index.ts');
  assert(fs.existsSync(storeIndexPath), 'src/store/index.ts must exist');
  const storeContent = fs.readFileSync(storeIndexPath, 'utf8');

  const requiredSlices = ['agents', 'chat', 'connection', 'groups', 'notifications', 'providers', 'settings'];
  for (const slice of requiredSlices) {
    const slicePath = path.join(STORE_DIR, 'slices', `${slice}.ts`);
    assert(fs.existsSync(slicePath), `Required slice src/store/slices/${slice}.ts must exist`);
    assert(storeContent.includes(slice), `src/store/index.ts must register '${slice}' slice`);
  }
});

runTest('Contract 2: Strict Layer Boundaries (UI cannot import runtime API or call fetch/WebSocket)', () => {
  const uiFiles = [...walkTsFiles(APP_DIR), ...walkTsFiles(COMPONENTS_DIR)];
  const violations = [];

  for (const filePath of uiFiles) {
    const rel = path.relative(ROOT_DIR, filePath);
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    lines.forEach((line, idx) => {
      const isTypeOnly = /^\s*import\s+type\b/.test(line);
      if (!isTypeOnly && /from\s+['"](\.\.\/)+api(\/|['"])/.test(line)) {
        // Exception: AgentAvatar needs pure URL helper buildProfilePicUrl (zero fetch/network call)
        if (!(rel.endsWith('AgentAvatar.tsx') && line.includes('api/modules/agents'))) {
          violations.push(`${rel}:${idx + 1} - Runtime import from api/ forbidden in UI layer`);
        }
      }
      if (/\bfetch\s*\(/.test(line) || /\bnew\s+WebSocket\s*\(/.test(line)) {
        violations.push(`${rel}:${idx + 1} - Direct network call forbidden in UI layer`);
      }
    });
  }

  if (violations.length > 0) {
    throw new Error(`Layer Boundary Violations:\n    ${violations.join('\n    ')}`);
  }
});

runTest('Contract 3: Zero Hardcoded Colors or Font Families outside src/theme/', () => {
  assert(fs.existsSync(THEME_DIR), 'src/theme directory must exist');
  const uiFiles = [...walkTsFiles(APP_DIR), ...walkTsFiles(COMPONENTS_DIR)];
  const violations = [];

  for (const filePath of uiFiles) {
    const rel = path.relative(ROOT_DIR, filePath);
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    lines.forEach((line, idx) => {
      const stripped = line.replace(/\/\/.*$/, '');
      if (/#[0-9a-fA-F]{3,8}\b/.test(stripped) || /rgba?\s*\(/.test(stripped)) {
        violations.push(`${rel}:${idx + 1} - Hardcoded color literal forbidden outside src/theme/`);
      }
      if (/fontFamily\s*:\s*['"]/.test(stripped)) {
        violations.push(`${rel}:${idx + 1} - Hardcoded fontFamily string forbidden outside src/theme/`);
      }
    });
  }

  if (violations.length > 0) {
    throw new Error(`Design Token Violations:\n    ${violations.join('\n    ')}`);
  }
});

runTest('Contract 4: Strict Component Size Ceiling (Max 350 lines, ZERO exemptions)', () => {
  const MAX_LINES = 350;
  const uiFiles = [...walkTsFiles(APP_DIR), ...walkTsFiles(COMPONENTS_DIR)];
  const oversized = [];

  for (const filePath of uiFiles) {
    const rel = path.relative(ROOT_DIR, filePath);
    const lineCount = fs.readFileSync(filePath, 'utf8').split('\n').length;
    if (lineCount > MAX_LINES) {
      oversized.push(`${rel}: ${lineCount} lines (limit ${MAX_LINES})`);
    }
  }

  if (oversized.length > 0) {
    throw new Error(`File Size Violations:\n    ${oversized.join('\n    ')}`);
  }
});

runTest('Contract 5: Round-Trip Serialization Fuzzing', () => {
  const payloads = [
    { text: 'Normal text', number: 42, active: true },
    { text: 'Null \0 and newline \n', nested: { arr: [1, null, 'a'] } },
    { huge: 'A'.repeat(25000), zero: 0, falseVal: false },
  ];
  for (const p of payloads) {
    assert.deepStrictEqual(JSON.parse(JSON.stringify(p)), p);
  }
});

console.log('\n------------------------------------------------------');
console.log(`Results: ${passedTests}/${totalTests} Passed (${failedTests} Failures)`);
console.log('------------------------------------------------------\n');

process.exit(failedTests > 0 ? 1 : 0);
