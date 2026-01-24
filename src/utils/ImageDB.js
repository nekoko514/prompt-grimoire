import { openDB } from 'idb';

const DB_NAME = 'grimoire_gallery';
const STORE_NAME = 'images';

class ImageDB {
    async init() {
        this.db = await openDB(DB_NAME, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                }
            },
        });
    }

    async addImage(file) {
        if (!this.db) await this.init();

        // Convert File to Base64/Buffer to ensure easy storage if needed, 
        // but IDB can store Blobs directly.
        // Let's store object with timestamp.

        return this.db.add(STORE_NAME, {
            blob: file,
            name: file.name,
            timestamp: new Date().toLocaleDateString(),
            type: file.type
        });
    }

    async getAllImages() {
        if (!this.db) await this.init();
        return this.db.getAll(STORE_NAME);
    }

    async deleteImage(id) {
        if (!this.db) await this.init();
        return this.db.delete(STORE_NAME, id);
    }
}

export default new ImageDB();
