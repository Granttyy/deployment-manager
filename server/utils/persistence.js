const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, '../../history.json');

const persistence = {
    getHistory: () => {
        if (!fs.existsSync(HISTORY_FILE)) return [];
        try {
            return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        } catch {
            return [];
        }
    },

    saveEvent: (event) => {
        const history = persistence.getHistory();
        history.unshift(event);
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history.slice(0, 10), null, 2));
    },

    getNextPort: () => {
        const history = persistence.getHistory();
        const defaultStart = 8081;
        if (history.length === 0) return defaultStart;
        const maxPort = Math.max(
            defaultStart - 1,
            ...history
                .map((e) => e && typeof e.port === 'number' ? e.port : null)
                .filter((p) => Number.isFinite(p))
        );
        return maxPort + 1;
    },
};

module.exports = persistence;