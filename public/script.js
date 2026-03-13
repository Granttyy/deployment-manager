async function startDeploy() {
    const repoUrl = document.getElementById('repoUrl').value;
    const envContent = document.getElementById('envContent').value;
    
    // UI Changes
    document.getElementById('statusArea').classList.remove('hidden');
    document.getElementById('deployBtn').disabled = true;
    document.getElementById('resultArea').classList.add('hidden');
    document.getElementById('statusText').innerText = 'Creating deployment...';

    try {
        // Use the new MVP API and poll for status
        const response = await fetch('/api/deployments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repoUrl, env: envContent })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.error || 'Failed to create deployment');
        }

        const id = data?.deployment?.id;
        if (!id) throw new Error('No deployment id returned');

        const poll = async () => {
            const r = await fetch(`/api/deployments/${id}`);
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || 'Failed to poll status');
            return j.deployment;
        };

        const statusLabel = (s) => {
            switch (s) {
                case 'queued': return 'Queued...';
                case 'cloning': return 'Cloning repository...';
                case 'building': return 'Building Docker image...';
                case 'starting': return 'Starting container...';
                case 'live': return 'Live!';
                case 'failed': return 'Failed';
                case 'stopped': return 'Stopped';
                default: return s || 'Working...';
            }
        };

        const startedAt = Date.now();
        const timeoutMs = 10 * 60 * 1000; // 10 minutes

        while (true) {
            if (Date.now() - startedAt > timeoutMs) {
                throw new Error('Timed out waiting for deployment to finish');
            }

            const dep = await poll();
            document.getElementById('statusText').innerText = statusLabel(dep.status);

            if (dep.status === 'live' && dep.publicUrl) {
                document.getElementById('statusArea').classList.add('hidden');
                document.getElementById('resultArea').classList.remove('hidden');
                document.getElementById('liveLink').href = dep.publicUrl;
                document.getElementById('liveLink').innerText = dep.publicUrl;
                try {
                    const r = await fetch('/api/tunnel-password');
                    const j = await r.json();
                    if (r.ok && j?.password) {
                        document.getElementById('tunnelPasswordArea').classList.remove('hidden');
                        document.getElementById('tunnelPassword').innerText = j.password;
                    }
                } catch {
                    // Ignore if unavailable
                }
                return;
            }

            if (dep.status === 'failed') {
                const msg = dep?.error?.message || 'Deployment failed';
                throw new Error(msg);
            }

            await new Promise((r) => setTimeout(r, 2000));
        }
    } catch (err) {
        alert(`Deployment failed: ${err.message || err}`);
    } finally {
        document.getElementById('deployBtn').disabled = false;
    }
}