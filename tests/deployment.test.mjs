import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, existsSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
test('deployment includes the runtime shell and excludes docs, tests, and unreferenced artwork',()=>{
  const output=mkdtempSync(join(tmpdir(),'ta-deploy-test-'));
  try {
    execFileSync(process.execPath,['scripts/stage-site.mjs',output]);
    for (const file of ['index.html','sw.js','assets/js/core/ledger.js','assets/js/core/note-import.js','assets/js/ledger-ui.js','assets/css/app.css','manifest.webmanifest']) assert.ok(existsSync(join(output,file)),file);
    for (const file of ['README.md','context','tests','data','assets/icons/t-a-wip.svg','.git']) assert.equal(existsSync(join(output,file)),false,file);
    assert.match(readFileSync('.github/workflows/deploy-pages.yml','utf8'),/path: _site/);
  } finally { rmSync(output,{recursive:true,force:true}); }
});
