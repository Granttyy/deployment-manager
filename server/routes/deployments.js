const express = require('express');
const crypto = require('crypto');

const persistence = require('../utils/persistence');
const store = require('../deployments/store');
const { runDeployment, stopDeployment } = require('../deployments/runner');

const router = express.Router();

function nowIso() {
  return new Date().toISOString();
}

function isValidGitHubRepoUrl(repoUrl) {
  if (typeof repoUrl !== 'string') return false;
  const u = repoUrl.trim();
  return /^https?:\/\/github\.com\/[^\/]+\/[^\/]+(\.git)?\/?$/i.test(u);
}

function deriveRepoName(repoUrl) {
  const parts = repoUrl.replace(/\/+$/, '').split('/');
  return parts[parts.length - 1].replace(/\.git$/i, '');
}

function newId() {
  // Node 20 supports randomUUID
  return `dep_${crypto.randomUUID().replace(/-/g, '')}`;
}

router.get('/', (req, res) => {
  res.json({ deployments: store.apiList() });
});

router.post('/', (req, res) => {
  const { repoUrl, env, ref } = req.body || {};

  if (!isValidGitHubRepoUrl(repoUrl)) {
    return res.status(400).json({ error: 'Invalid GitHub repo URL' });
  }

  const id = newId();
  const port = persistence.getNextPort();
  const repoName = deriveRepoName(repoUrl);

  store.create({
    id,
    repoUrl: repoUrl.trim(),
    repoName,
    ref: typeof ref === 'string' && ref.trim() ? ref.trim() : 'main',
    env: typeof env === 'string' ? env : null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    status: 'queued',
    port,
    containerName: id,
    imageName: id,
    publicUrl: null,
    error: null,
  });

  // Run async in background
  setImmediate(() => {
    runDeployment(id);
  });

  return res.status(202).json({
    deployment: store.apiGet(id),
    pollUrl: `/api/deployments/${id}`,
  });
});

router.get('/:id', (req, res) => {
  const dep = store.apiGet(req.params.id);
  if (!dep) return res.status(404).json({ error: 'Not found' });
  res.json({ deployment: dep });
});

router.get('/:id/logs', (req, res) => {
  const dep = store.get(req.params.id);
  if (!dep) return res.status(404).json({ error: 'Not found' });
  res.json({ id: dep.id, logs: dep.logs || { entries: [], truncated: false } });
});

router.post('/:id/stop', async (req, res) => {
  const dep = store.get(req.params.id);
  if (!dep) return res.status(404).json({ error: 'Not found' });
  const stopped = await stopDeployment(dep.id);
  res.json({ deployment: stopped });
});

module.exports = router;

