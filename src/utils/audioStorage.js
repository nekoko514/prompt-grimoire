/**
 * Audio Storage Utility - IndexedDB for custom tracks
 */

const DB_NAME = 'PromptGrimoireAudio';
const DB_VERSION = 1;
const STORE_NAME = 'customTracks';

/**
 * Open IndexedDB connection
 */
export const openAudioDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
};

/**
 * Convert File to Base64
 */
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Save a custom track to IndexedDB
 * @param {Object} trackData - { id, label, freq, icon, audioBase64, imageBase64? }
 */
export const saveCustomTrack = async (trackData) => {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(trackData);

        request.onsuccess = () => resolve(trackData);
        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => db.close();
    });
};

/**
 * Get all custom tracks from IndexedDB
 */
export const getAllCustomTracks = async () => {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => db.close();
    });
};

/**
 * Delete a custom track from IndexedDB
 */
export const deleteCustomTrack = async (trackId) => {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(trackId);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => db.close();
    });
};
