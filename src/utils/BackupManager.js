/**
 * BackupManager.js
 * Handles the export and import of application state from localStorage.
 */

// Keys in localStorage that we want to backup
const STORAGE_KEYS = [
    'saved_prompts',    // Library Room: Saved prompts
    'guest_notes',      // Writing Desk: Text notes
    'shadow_contracts', // Contract Room: ToDo list
    'soul_points',      // Contract Room: Currency
    'high_low_streak',  // Game Room: High/Low stats
    'high_low_best_streak',
    // Add other keys here as the app grows
];

export const BackupManager = {
    /**
     * Export all relevant data to a JSON string.
     * @returns {string} JSON string containing the backup.
     */
    createBackup: () => {
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: {}
        };

        STORAGE_KEYS.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                try {
                    // Try to parse JSON to store it neatly, otherwise store as string
                    backupData.data[key] = JSON.parse(value);
                } catch (e) {
                    backupData.data[key] = value;
                }
            }
        });

        return JSON.stringify(backupData, null, 2);
    },

    /**
     * Triggers a file download for the backup.
     */
    downloadBackup: () => {
        const json = BackupManager.createBackup();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create filename with date: grimoire_backup_YYYY-MM-DD.json
        const date = new Date().toISOString().split('T')[0];
        const filename = `grimoire_backup_${date}.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Restores data from a JSON object.
     * @param {object} backupData - The parsed JSON backup file.
     * @returns {boolean} True if successful.
     */
    restoreBackup: (backupData) => {
        if (!backupData || !backupData.data) {
            console.error("Invalid backup file format.");
            return false;
        }

        try {
            // Loop through the data keys and save them back to localStorage
            Object.keys(backupData.data).forEach(key => {
                // We only restore keys that are in our safe list, or we could restore everything
                // For now, let's restore everything found in the 'data' object to be flexible
                const value = backupData.data[key];

                // If it's an object/array, stringify it. If it's a primitive, store as is.
                if (typeof value === 'object') {
                    localStorage.setItem(key, JSON.stringify(value));
                } else {
                    localStorage.setItem(key, value);
                }
            });
            return true;
        } catch (e) {
            console.error("Error restoring backup:", e);
            return false;
        }
    }
};
