const { exec } = require('child_process');

const deploy = (repoName) => {
    const imageName = repoName.toLowerCase();
    const containerName = `${imageName}-container`;

    console.log(`🚀 Real Deployment starting for: ${repoName}...`);

    const commands = [
        // 1. Build the image and tag it
        `docker build -t ${imageName} .`,
        
        // 2. Stop the old container (using || true so it doesn't crash if container doesn't exist yet)
        `docker stop ${containerName} || true`,
        
        // 3. Remove the old container
        `docker rm ${containerName} || true`,
        
        // 4. Run a new container on port 8080 (so it doesn't clash with your manager on 3000)
        `docker run -d --name ${containerName} -p 8080:3000 ${imageName}`
    ];

    const fullCommand = commands.join(' && ');

    exec(fullCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Docker Error: ${error.message}`);
            return;
        }
        console.log(`📝 Docker Output:\n${stdout}`);
        console.log(`✅ Container is live at http://localhost:8080`);
    });
};

module.exports = { deploy };