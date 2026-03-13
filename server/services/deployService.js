const { exec } = require('child_process');
const config = require('../config');
const persistence = require('../utils/persistence');
const { sendNotification } = require('../utils/notifier');

// Backward-compatible signature:
// - deploy(repoName, port, callback, customPath)
// - deploy(repoName, callback)  // uses next available port and current directory
const deploy = (repoName, portOrCallback, callbackOrPath, maybePath) => {
    const port = typeof portOrCallback === 'number' ? portOrCallback : persistence.getNextPort();
    const callback = typeof portOrCallback === 'function' ? portOrCallback : callbackOrPath;
    const customPath = typeof portOrCallback === 'function'
        ? (typeof callbackOrPath === 'string' ? callbackOrPath : '.')
        : (typeof maybePath === 'string' ? maybePath : '.');

    const containerPort = 3000;
    const commands = [
        `cd "${customPath}"`,
        `docker build -t ${repoName} .`,
        `docker stop ${repoName} 2>nul || ver >nul`,
        `docker rm ${repoName} 2>nul || ver >nul`,
        `docker run -d --name ${repoName} -e PORT=${containerPort} -p ${port}:${containerPort} ${repoName}`,
    ];

    exec(commands.join(' && '), (error, stdout, stderr) => {
        if (error) {
            console.error('--- DOCKER ERROR LOG ---');
            console.error(stderr);
            console.error('------------------------');
        }

        const success = !error;

        persistence.saveEvent({
            timestamp: new Date().toLocaleString(),
            repo: repoName,
            port,
            status: success ? '✅ Success' : '❌ Failed',
            error: error?.message ?? null,
        });

        sendNotification(repoName, success ? '✅ Success' : '❌ Failed', error?.message ?? null);

        callback?.(success);
    });
};

module.exports = { deploy };