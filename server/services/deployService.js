const { exec } = require('child_process');
const config = require('../config');

/**
 * Builds and redeploys a Docker container for the given repository.
 *
 * @param {string} repoName - The GitHub repository name being deployed
 * @param {function} [callback] - Optional callback; receives `true` on success, `false` on failure
 */
const deploy = (repoName, callback) => {
    const { imageName, containerName, portMapping } = config.docker;

    const commands = [
        `docker build -t ${imageName} .`,
        `docker stop ${containerName} || true`,
        `docker rm ${containerName} || true`,
        `docker run -d --name ${containerName} -p ${portMapping} ${imageName}`,
        `docker image prune -f`,
    ];

    exec(commands.join(' && '), (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Deployment failed for "${repoName}": ${error.message}`);
            callback?.(false);
            return;
        }

        console.log(`✅ Successfully redeployed "${repoName}".`);
        callback?.(true);
    });
};

module.exports = { deploy };