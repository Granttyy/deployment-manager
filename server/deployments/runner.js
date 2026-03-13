const path = require('path');
const fs = require('fs');
const { execFile, exec } = require('child_process');
const localtunnel = require('localtunnel');

const persistence = require('../utils/persistence');
const { sendNotification } = require('../utils/notifier');
const store = require('./store');

function readDockerfileStages(repoDir) {
  try {
    const dockerfilePath = path.join(repoDir, 'Dockerfile');
    if (!fs.existsSync(dockerfilePath)) return [];
    const txt = fs.readFileSync(dockerfilePath, 'utf8');
    const stages = [];
    const re = /^\s*FROM\s+.+?\s+AS\s+([A-Za-z0-9._-]+)\s*$/gim;
    let m;
    while ((m = re.exec(txt))) {
      stages.push(m[1]);
    }
    return stages;
  } catch {
    return [];
  }
}

function execFilePromise(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = execFile(cmd, args, opts, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout;
        err.stderr = stderr;
        return reject(err);
      }
      resolve({ stdout, stderr });
    });

    if (opts.stdio !== 'inherit') {
      child.stdout?.on('data', (d) => opts.onData?.(String(d)));
      child.stderr?.on('data', (d) => opts.onData?.(String(d)));
    }
  });
}

function execPromise(command, opts = {}) {
  return new Promise((resolve, reject) => {
    exec(command, opts, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout;
        err.stderr = stderr;
        return reject(err);
      }
      resolve({ stdout, stderr });
    });
  });
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function validateGitHubRepoUrl(repoUrl) {
  if (typeof repoUrl !== 'string') return false;
  const u = repoUrl.trim();
  return /^https?:\/\/github\.com\/[^\/]+\/[^\/]+(\.git)?\/?$/i.test(u);
}

async function dockerBuildWithFallbacks({ repoDir, imageName, log }) {
  const baseCmd = `cd "${repoDir}" && docker build -t ${imageName} .`;

  const runBuild = async (command, env) => {
    log('info', command);
    const { stdout, stderr } = await execPromise(command, {
      windowsHide: true,
      maxBuffer: 20 * 1024 * 1024,
      env,
    });
    if (stdout) log('info', stdout.trimEnd());
    if (stderr) log('info', stderr.trimEnd());
  };

  try {
    // Default (BuildKit typically enabled)
    await runBuild(baseCmd, process.env);
    return;
  } catch (err) {
    const msgParts = [err?.message, err?.stderr, err?.stdout].filter(Boolean).map(String);
    const msg = msgParts.join('\n');
    if (msg) log('error', msg.slice(0, 4000));

    // Fallback 1: retry build with BuildKit disabled.
    // Many public repos have Dockerfiles that fail under BuildKit parsing rules.
    const legacyEnv = { ...process.env, DOCKER_BUILDKIT: '0' };
    try {
      log('info', 'Retrying build with DOCKER_BUILDKIT=0');
      await runBuild(baseCmd, legacyEnv);
      return;
    } catch (err2) {
      const msg2Parts = [err2?.message, err2?.stderr, err2?.stdout].filter(Boolean).map(String);
      const msg2 = msg2Parts.join('\n');
      if (msg2) log('error', msg2.slice(0, 4000));

      // Fallback 2: if the Dockerfile defines a "RELEASE" stage, try building only that stage
      // (some repos run tests/lint in intermediate stages that can fail on Windows checkouts).
      const stages = readDockerfileStages(repoDir);
      const releaseStage = stages.find((s) => s.toLowerCase() === 'release');
      if (!releaseStage) throw err2;

      const targetCmd = `cd "${repoDir}" && docker build --target ${releaseStage} -t ${imageName} .`;
      log('info', `Retrying build with --target ${releaseStage}`);
      await runBuild(targetCmd, legacyEnv);
    }
  }
}

async function runDeployment(id) {
  const dep = store.get(id);
  if (!dep) return;
  if (dep.status !== 'queued') return;

  const clonesDir = path.join(__dirname, '../../clones');
  ensureDir(clonesDir);

  const repoUrl = dep.repoUrl;
  if (!validateGitHubRepoUrl(repoUrl)) {
    store.update(id, {
      status: 'failed',
      error: { message: 'Invalid GitHub repo URL', step: 'queued' },
    });
    return;
  }

  const assignedPort = dep.port || persistence.getNextPort();
  store.update(id, { port: assignedPort });

  const repoDir = dep.repoDir || path.join(clonesDir, dep.id);
  store.update(id, { repoDir });

  const imageName = dep.imageName || dep.id;
  const containerName = dep.containerName || dep.id;
  store.update(id, { imageName, containerName });

  const log = (level, msg) => store.appendLog(id, level, msg);

  try {
    store.update(id, { status: 'cloning', error: null });
    log('info', `Cloning ${repoUrl}`);
    // Prevent Windows line-ending conversion causing Docker builds/tests to fail.
    await execFilePromise('git', ['-c', 'core.autocrlf=false', 'clone', '--depth', '1', repoUrl, repoDir], {
      onData: (d) => log('info', d.trimEnd()),
      windowsHide: true,
    });

    if (dep.env) {
      store.update(id, { status: 'cloning' });
      log('info', 'Writing .env');
      fs.writeFileSync(path.join(repoDir, '.env'), dep.env);
    }

    store.update(id, { status: 'building' });
    await dockerBuildWithFallbacks({ repoDir, imageName, log });

    store.update(id, { status: 'starting' });
    log('info', `Starting container ${containerName} on port ${assignedPort}`);
    // Stop/remove if exists (idempotent)
    await execPromise(`docker stop ${containerName} 2>nul || ver >nul`, { windowsHide: true });
    await execPromise(`docker rm ${containerName} 2>nul || ver >nul`, { windowsHide: true });

    const containerPort = 3000;
    await execPromise(
      `docker run -d --name ${containerName} -e PORT=${containerPort} -p ${assignedPort}:${containerPort} ${imageName}`,
      { windowsHide: true }
    );

    log('info', 'Creating public URL (tunnel)');
    const tunnel = await localtunnel({ port: assignedPort });
    store.setTunnel(id, tunnel);

    store.update(id, { status: 'live', publicUrl: tunnel.url });
    log('info', `Live: ${tunnel.url}`);

    sendNotification(
      dep.repoName || dep.repoUrl,
      '✅ Success',
      null,
      { url: tunnel.url, id }
    );

    // Save a short event for the history dashboard
    persistence.saveEvent({
      timestamp: new Date().toLocaleString(),
      repo: dep.repoName || repoUrl,
      port: assignedPort,
      status: '✅ Success',
      error: null,
    });
  } catch (err) {
    const details = (err && (err.stderr || err.stdout)) ? String(err.stderr || err.stdout) : null;
    store.update(id, {
      status: 'failed',
      error: { message: err?.message || 'Deployment failed', step: dep.status, details },
    });
    log('error', err?.message || 'Deployment failed');
    if (details) log('error', details.slice(0, 4000));

    persistence.saveEvent({
      timestamp: new Date().toLocaleString(),
      repo: dep.repoName || dep.repoUrl,
      port: dep.port ?? null,
      status: '❌ Failed',
      error: err?.message ?? 'Deployment failed',
    });

    sendNotification(
      dep.repoName || dep.repoUrl,
      '❌ Failed',
      err?.message ?? 'Deployment failed',
      { id }
    );
  }
}

async function stopDeployment(id) {
  const dep = store.get(id);
  if (!dep) return null;

  const log = (level, msg) => store.appendLog(id, level, msg);
  store.update(id, { status: 'stopping' });
  log('info', 'Stopping deployment');

  try {
    if (dep._tunnel && typeof dep._tunnel.close === 'function') {
      try {
        dep._tunnel.close();
      } catch {
        // ignore
      }
    }
    if (dep.containerName) {
      await execPromise(`docker stop ${dep.containerName} 2>nul || ver >nul`, { windowsHide: true });
      await execPromise(`docker rm ${dep.containerName} 2>nul || ver >nul`, { windowsHide: true });
    }

    store.update(id, { status: 'stopped', publicUrl: null });
    log('info', 'Stopped');
    return store.apiGet(id);
  } catch (err) {
    store.update(id, { status: 'failed', error: { message: err?.message || 'Stop failed', step: 'stopping' } });
    log('error', err?.message || 'Stop failed');
    return store.apiGet(id);
  }
}

module.exports = { runDeployment, stopDeployment };

