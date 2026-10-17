import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

const projectRoot = path.resolve(__dirname, '../..');
const outDir = path.join(projectRoot, 'out');

function sha256File(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function isPngValid(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  const stat = fs.statSync(filePath);
  if (stat.size < 50000) return false; // Full HD 1080p frame should easily exceed 50KB

  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(8);
  fs.readSync(fd, buffer, 0, 8, 0);
  fs.closeSync(fd);

  // PNG magic number: 89 50 4E 47 0D 0A 1A 0A
  return (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
}

test('E2E Smoke: agent discovery introspection runs cleanly with valid capabilities', () => {
  const result = execSync('npx tsx scripts/agent-discover.ts --json', {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  const data = JSON.parse(result);
  assert.strictEqual(data.version, '1.0.0');
  assert.ok(data.assets.total >= 18, 'Expected at least 18 assets');
  assert.ok(data.characters.presets.length >= 1, 'Expected character presets');
  assert.ok(data.environments.presets.length >= 2, 'Expected at least 2 environment presets');
  assert.ok(data.camera.presets.length >= 8, 'Expected camera presets');
});

test('E2E Smoke: inspect-scene validates both Tokyo encounter and rainy evening fixtures', () => {
  const scene1 = execSync('npx tsx scripts/inspect-scene.ts scenes/agent-dialog-scene.json --json', {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  assert.strictEqual(JSON.parse(scene1).valid, true);

  const scene2 = execSync('npx tsx scripts/inspect-scene.ts scenes/rainy-street-encounter.json --json', {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  assert.strictEqual(JSON.parse(scene2).valid, true);
});

test('E2E Smoke: renders still frames across all registered compositions', () => {
  const testOutputs = [
    { id: 'PeerProSandbox', out: 'e2e-smoke-sandbox.png', frame: 30 },
    { id: 'CharacterShowcase', out: 'e2e-smoke-characters.png', frame: 30 },
    { id: 'EnvironmentShowcase', out: 'e2e-smoke-environment.png', frame: 40 },
    { id: 'ParallaxTest', out: 'e2e-smoke-parallax.png', frame: 60 },
    { id: 'AgentScene', out: 'e2e-smoke-agentscene.png', frame: 45 },
    { id: 'StyleShowcase', out: 'e2e-smoke-styleshowcase.png', frame: 60 },
  ];

  for (const { id, out, frame } of testOutputs) {
    const targetPath = path.join(outDir, out);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }

    execSync(`npx remotion still ${id} "${targetPath}" --frame=${frame}`, {
      cwd: projectRoot,
      stdio: 'pipe',
    });

    assert.ok(fs.existsSync(targetPath), `File must be generated: ${out}`);
    assert.ok(isPngValid(targetPath), `File must be valid PNG >50KB: ${out}`);

    // Clean up temporary e2e smoke test files
    fs.unlinkSync(targetPath);
  }
});

test('E2E Determinism: AgentScene generates identical SHA-256 hash on successive renders', () => {
  const pathA = path.join(outDir, 'e2e-determinism-a.png');
  const pathB = path.join(outDir, 'e2e-determinism-b.png');

  if (fs.existsSync(pathA)) fs.unlinkSync(pathA);
  if (fs.existsSync(pathB)) fs.unlinkSync(pathB);

  execSync(`npx remotion still AgentScene "${pathA}" --frame=50`, {
    cwd: projectRoot,
    stdio: 'pipe',
  });

  execSync(`npx remotion still AgentScene "${pathB}" --frame=50`, {
    cwd: projectRoot,
    stdio: 'pipe',
  });

  assert.ok(fs.existsSync(pathA));
  assert.ok(fs.existsSync(pathB));

  const hashA = sha256File(pathA);
  const hashB = sha256File(pathB);

  assert.strictEqual(hashA, hashB, `Hashes must be identical for deterministic render: ${hashA} vs ${hashB}`);

  fs.unlinkSync(pathA);
  fs.unlinkSync(pathB);
});
