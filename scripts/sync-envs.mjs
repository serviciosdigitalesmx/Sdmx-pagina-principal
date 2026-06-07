#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { stdin as input, stdout as output } from 'node:process';
import readline from 'node:readline/promises';

const rl = readline.createInterface({ input, output });
const ROOT = process.cwd();
const RENDER_SERVICE_ID = 'srv-d7mj7f1j2pic73942q8g';
const VERCEL_SCOPE = 'serviciosdigitalesmxs-projects';

function parseArgs(argv) {
  const args = new Map();
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args.set(arg.slice(2), true);
    } else {
      args.set(arg.slice(2), next);
      i += 1;
    }
  }
  return args;
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'], ...opts });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || stdout || `${cmd} exited with ${code}`));
        return;
      }
      resolve(stdout.trim());
    });
    if (opts.input) {
      child.stdin.end(opts.input);
    } else {
      child.stdin.end();
    }
  });
}

async function prompt(question) {
  return (await rl.question(question)).trim();
}

function unique(arr) {
  return [...new Set(arr.filter(Boolean))].sort();
}

function extractEnvNamesFromText(text) {
  const names = new Set();
  const patterns = [
    /process\.env\.([A-Z0-9_]+)/g,
    /optionalEnv\(\s*["']([A-Z0-9_]+)["']\s*\)/g,
    /env\.([A-Z0-9_]+)/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text))) {
      names.add(match[1]);
    }
  }
  return [...names];
}

async function collectCodeEnvNames(dir) {
  const files = await run('bash', ['-lc', `rg --files ${JSON.stringify(dir)} | tr '\n' '\0' | xargs -0 cat`]);
  return unique(extractEnvNamesFromText(files));
}

async function getVercelEnvMap(cwd) {
  const output = await run('vercel', ['env', 'ls', 'production', '--scope', VERCEL_SCOPE], { cwd });
  const lines = output.split('\n').map((line) => line.trim()).filter(Boolean);
  const map = new Map();
  for (const line of lines.slice(1)) {
    const key = line.split(/\s+/)[0];
    if (/^[A-Z0-9_]+$/.test(key)) {
      map.set(key, null);
    }
  }
  return map;
}

async function getVercelValue(key, cwd) {
  const value = await run('vercel', ['env', 'pull', '.env.__tmp_pull', '--scope', VERCEL_SCOPE], { cwd });
  return value;
}

async function getRenderEnvMap() {
  const token = process.env.RENDER_API_KEY;
  if (!token) throw new Error('RENDER_API_KEY not set');
  const data = await run('node', ['-e', `
const https = require('https');
const token = process.env.RENDER_API_KEY;
https.get('https://api.render.com/v1/services/${RENDER_SERVICE_ID}/env-vars', { headers: { Authorization: 'Bearer ' + token } }, res => { let data=''; res.on('data', d => data += d); res.on('end', () => process.stdout.write(data)); }).on('error', err => { console.error(err); process.exit(1); });
`], { env: { ...process.env, RENDER_API_KEY: token } });
  const parsed = JSON.parse(data);
  const map = new Map();
  for (const row of parsed) map.set(row.envVar.key, row.envVar.value);
  return map;
}

async function setRenderEnv(key, value) {
  const token = process.env.RENDER_API_KEY;
  const body = JSON.stringify({ value });
  await run('node', ['-e', `
const https = require('https');
const token = process.env.RENDER_API_KEY;
const body = ${JSON.stringify(body)};
const req = https.request({
  method: 'PUT',
  hostname: 'api.render.com',
  path: '/v1/services/${RENDER_SERVICE_ID}/env-vars/' + encodeURIComponent(${JSON.stringify(key)}),
  headers: {
    Authorization: 'Bearer ' + token,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
}, res => {
  let data='';
  res.on('data', d => data += d);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      process.stdout.write(data);
      return;
    }
    console.error(data);
    process.exit(1);
  });
});
req.on('error', err => { console.error(err); process.exit(1); });
req.write(body);
req.end();
`], { env: { ...process.env, RENDER_API_KEY: token } });
}

async function setVercelEnv(key, value, cwd) {
  await run('vercel', ['env', 'rm', key, 'production', '--scope', VERCEL_SCOPE], { cwd, input: 'y\n' }).catch(() => {});
  await run('vercel', ['env', 'add', key, 'production', '--scope', VERCEL_SCOPE], { cwd, input: `${value}\n` });
}

const apps = {
  api: { type: 'render', dir: 'apps/api/src' },
  'web-admin': { type: 'vercel', dir: 'apps/web-admin/src', cwd: `${ROOT}/apps/web-admin` },
  'web-public': { type: 'vercel', dir: 'apps/web-public/src', cwd: `${ROOT}/apps/web-public` },
  'web-clientes': { type: 'vercel', dir: 'apps/web-clientes/src', cwd: `${ROOT}/apps/web-clientes` },
};

async function main() {
  const args = parseArgs(process.argv);
  const from = String(args.get('from') || '');
  const to = String(args.get('to') || '');
  const apply = Boolean(args.get('apply'));

  if (!from || !to) {
    throw new Error('Usage: node scripts/sync-envs.mjs --from <app> --to <app> [--apply]');
  }

  if (!apps[from] || !apps[to]) {
    throw new Error(`Unknown app. Supported: ${Object.keys(apps).join(', ')}`);
  }

  const sourceCodeNames = await collectCodeEnvNames(apps[from].dir);
  const destinationCodeNames = await collectCodeEnvNames(apps[to].dir);
  const names = unique([...sourceCodeNames, ...destinationCodeNames]);

  const sourceEnv = apps[from].type === 'render' ? await getRenderEnvMap() : await getVercelEnvMap(apps[from].cwd);
  const destinationEnv = apps[to].type === 'render' ? await getRenderEnvMap() : await getVercelEnvMap(apps[to].cwd);

  const plan = names.map((key) => ({
    key,
    sourceHas: sourceEnv.has(key),
    destHas: destinationEnv.has(key),
    action: sourceEnv.has(key) && !destinationEnv.has(key) ? 'copy' : sourceEnv.has(key) && destinationEnv.has(key) ? 'keep' : 'skip',
  }));

  if (!apply) {
    console.log(JSON.stringify(plan, null, 2));
    rl.close();
    return;
  }

  const confirmation = await prompt(`Apply ${plan.filter((item) => item.action === 'copy').length} updates from ${from} to ${to}? Type YES to continue: `);
  if (confirmation !== 'YES') {
    rl.close();
    console.log('Aborted.');
    return;
  }

  for (const item of plan) {
    if (item.action !== 'copy') continue;
    const value = sourceEnv.get(item.key);
    if (typeof value !== 'string') continue;

    if (to === 'render') {
      await setRenderEnv(item.key, value);
    } else {
      await setVercelEnv(item.key, value, apps[to].cwd);
    }
    console.log(`synced ${item.key}`);
  }

  rl.close();
}

main().catch((err) => {
  rl.close();
  console.error(err.message || err);
  process.exit(1);
});
