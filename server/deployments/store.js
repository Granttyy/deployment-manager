const MAX_LOG_ENTRIES = 500;
const MAX_LOG_CHARS = 200_000;

/** @type {Map<string, any>} */
const deployments = new Map();

function nowIso() {
  return new Date().toISOString();
}

function cloneForApi(dep) {
  if (!dep) return dep;
  // Don't leak internal fields like _tunnel
  // eslint-disable-next-line no-unused-vars
  const { _tunnel, ...rest } = dep;
  return rest;
}

function ensureLogs(dep) {
  if (!dep.logs) dep.logs = { entries: [], truncated: false };
  if (!dep.logs.entries) dep.logs.entries = [];
  if (typeof dep.logs.truncated !== 'boolean') dep.logs.truncated = false;
}

function totalLogChars(entries) {
  return entries.reduce((sum, e) => sum + (e?.message?.length ?? 0), 0);
}

function appendLog(id, level, message) {
  const dep = deployments.get(id);
  if (!dep) return;
  ensureLogs(dep);

  dep.logs.entries.push({ ts: nowIso(), level, message: String(message) });

  // Enforce caps
  while (dep.logs.entries.length > MAX_LOG_ENTRIES) {
    dep.logs.entries.shift();
    dep.logs.truncated = true;
  }
  while (totalLogChars(dep.logs.entries) > MAX_LOG_CHARS && dep.logs.entries.length > 0) {
    dep.logs.entries.shift();
    dep.logs.truncated = true;
  }

  dep.updatedAt = nowIso();
}

function create(deployment) {
  const dep = {
    ...deployment,
    createdAt: deployment.createdAt || nowIso(),
    updatedAt: deployment.updatedAt || nowIso(),
  };
  ensureLogs(dep);
  deployments.set(dep.id, dep);
  return dep;
}

function get(id) {
  return deployments.get(id) || null;
}

function update(id, patch) {
  const dep = deployments.get(id);
  if (!dep) return null;
  Object.assign(dep, patch, { updatedAt: nowIso() });
  return dep;
}

function setTunnel(id, tunnel) {
  const dep = deployments.get(id);
  if (!dep) return null;
  dep._tunnel = tunnel;
  dep.updatedAt = nowIso();
  return dep;
}

function apiGet(id) {
  return cloneForApi(get(id));
}

function apiList() {
  return Array.from(deployments.values()).map(cloneForApi);
}

module.exports = {
  create,
  get,
  update,
  appendLog,
  setTunnel,
  apiGet,
  apiList,
};

