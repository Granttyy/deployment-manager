const { exec } = require('child_process');

const deploy = (repoName) => {
    // We'll name the image after your project
    const imageName = "my-devops-app";
    const containerName = "my-running-app";

    console.log(`🚀 Starting REAL Docker build for: ${repoName}...`);

    // These are the actual commands that will run in your PowerShell/Terminal
   const commands = [
        // 1. Build the image
        `docker build -t ${imageName} .`,
        
        // 2. Stop and Remove the container (Windows friendly: ignore errors if it doesn't exist)
        `docker rm -f ${containerName} 2>null || echo "Container not running, skipping..."`,
        
        // 3. Run a new container
        `docker run -d --name ${containerName} -p 8080:3000 ${imageName}`
    ];

    const fullCommand = commands.join(' && ');

    exec(fullCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Docker Error: ${error.message}`);
            return;
        }
        console.log(`📝 Docker Build Output:\n${stdout}`);
        console.log(`✅ SUCCESS! App is live at http://localhost:8080`);
    });
};

module.exports = { deploy };