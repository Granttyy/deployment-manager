const axios = require('axios');

const sendNotification = async (repo, status, error = null, meta = null) => {
    const url = process.env.DISCORD_WEBHOOK_URL;
    if (!url) return;

    const isSuccess = status.includes('Success');
    
    // Create a "Rich Embed" for Discord
    const embed = {
        title: isSuccess ? "🚀 Deployment Successful" : "⚠️ Deployment Failed",
        color: isSuccess ? 0x2ecc71 : 0xe74c3c, // Green for success, Red for failure
        fields: [
            { name: "Repository", value: repo, inline: true },
            { name: "Status", value: status, inline: true },
            { name: "Timestamp", value: new Date().toLocaleString() }
        ],
        footer: { text: "Deployment Manager Service" }
    };

    if (meta?.url) {
        embed.fields.push({ name: "URL", value: meta.url });
    }
    if (meta?.id) {
        embed.fields.push({ name: "Deployment ID", value: meta.id, inline: true });
    }

    if (error) {
        // Truncate error if it's too long for Discord (max 1024 chars per field)
        embed.fields.push({ 
            name: "Error Details", 
            value: `\`\`\`${error.substring(0, 500)}...\`\`\`` 
        });
    }

    try {
        await axios.post(url, { embeds: [embed] });
    } catch (err) {
        console.error("❌ Failed to send Discord notification:", err.message);
    }
};

module.exports = { sendNotification };