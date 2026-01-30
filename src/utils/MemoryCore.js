import { openDB } from 'idb';

const DB_NAME = 'grimoire_memory';
const DB_VERSION = 2; // Upgraded version for multi-session support

class MemoryCore {
    constructor() {
        this.db = null;
        this._initPromise = null; // Prevent multiple init calls
    }

    async init() {
        // Return existing promise if already initializing
        if (this._initPromise) return this._initPromise;

        // Return immediately if already initialized
        if (this.db) return;

        this._initPromise = this._doInit();
        return this._initPromise;
    }

    async _doInit() {
        try {
            console.log('[MemoryCore] Initializing database...');

            // Add timeout to prevent infinite hang
            const dbPromise = openDB(DB_NAME, DB_VERSION, {
                upgrade(db, oldVersion, newVersion) {
                    console.log('[MemoryCore] Upgrading DB from', oldVersion, 'to', newVersion);

                    if (!db.objectStoreNames.contains('sessions')) {
                        const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
                        sessionsStore.createIndex('updatedAt', 'updatedAt');
                        sessionsStore.createIndex('isArchived', 'isArchived');
                    }

                    if (!db.objectStoreNames.contains('messages')) {
                        const messageStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
                        messageStore.createIndex('sessionId', 'sessionId');
                        messageStore.createIndex('timestamp', 'timestamp');
                    }

                    if (!db.objectStoreNames.contains('memory')) {
                        const memoryStore = db.createObjectStore('memory', { keyPath: 'id', autoIncrement: true });
                        memoryStore.createIndex('key', 'key');
                    }

                    if (!db.objectStoreNames.contains('knowledge')) {
                        const knowledgeStore = db.createObjectStore('knowledge', { keyPath: 'id', autoIncrement: true });
                        knowledgeStore.createIndex('isActive', 'isActive');
                    }
                },
            });

            // 5 second timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database initialization timed out')), 5000)
            );

            this.db = await Promise.race([dbPromise, timeoutPromise]);
            console.log('[MemoryCore] Database initialized successfully');

            await this._ensureCurrentSession();
        } catch (error) {
            console.error('[MemoryCore] Database init failed, using in-memory fallback:', error.message);
            this._useMemoryFallback();
        }
    }

    _useMemoryFallback() {
        console.log('[MemoryCore] Using in-memory storage (data will not persist)');
        this._inMemory = true;
        this._memoryStore = {
            sessions: [],
            messages: [],
            memory: [],
            knowledge: [],
            currentSession: null
        };

        // Create initial session
        const now = Date.now();
        const session = {
            id: `session_${now}`,
            title: `放送 ${new Date(now).toLocaleDateString('ja-JP')}`,
            createdAt: now,
            updatedAt: now,
            isArchived: false
        };
        this._memoryStore.sessions.push(session);
        this._memoryStore.currentSession = session;
        localStorage.setItem('currentSessionId', session.id);
    }

    // ========== SESSION MANAGEMENT ==========

    async _ensureCurrentSession() {
        if (this._inMemory) {
            return this._memoryStore.currentSession;
        }

        let currentId = localStorage.getItem('currentSessionId');
        if (currentId) {
            const session = await this.db.get('sessions', currentId);
            if (session) return session;
        }
        return this._createSessionInternal();
    }

    async _createSessionInternal(title = null) {
        const now = Date.now();
        const session = {
            id: `session_${now}_${Math.random().toString(36).substr(2, 9)}`,
            title: title || `放送 ${new Date(now).toLocaleDateString('ja-JP')}`,
            createdAt: now,
            updatedAt: now,
            isArchived: false
        };

        if (this._inMemory) {
            this._memoryStore.sessions.push(session);
            this._memoryStore.currentSession = session;
        } else {
            await this.db.put('sessions', session);
        }
        localStorage.setItem('currentSessionId', session.id);
        console.log('[MemoryCore] Created new session:', session.id);
        return session;
    }

    async ensureCurrentSession() {
        if (!this.db && !this._inMemory) await this.init();
        return this._ensureCurrentSession();
    }

    async createSession(title = null) {
        if (!this.db && !this._inMemory) await this.init();
        return this._createSessionInternal(title);
    }

    async getSession(id) {
        if (!this.db && !this._inMemory) await this.init();
        if (this._inMemory) {
            return this._memoryStore.sessions.find(s => s.id === id);
        }
        return this.db.get('sessions', id);
    }

    async getCurrentSession() {
        if (!this.db && !this._inMemory) await this.init();
        if (this._inMemory) {
            return this._memoryStore.currentSession;
        }
        const id = localStorage.getItem('currentSessionId');
        if (!id) return this.createSession();
        const session = await this.getSession(id);
        return session || this.createSession();
    }

    async updateSession(id, updates) {
        if (!this.db && !this._inMemory) await this.init();
        const session = await this.getSession(id);
        if (!session) return null;

        const updated = { ...session, ...updates, updatedAt: Date.now() };

        if (this._inMemory) {
            const idx = this._memoryStore.sessions.findIndex(s => s.id === id);
            if (idx !== -1) this._memoryStore.sessions[idx] = updated;
            if (this._memoryStore.currentSession?.id === id) {
                this._memoryStore.currentSession = updated;
            }
        } else {
            await this.db.put('sessions', updated);
        }
        return updated;
    }

    async listSessions(includeArchived = false) {
        if (!this.db && !this._inMemory) await this.init();

        if (this._inMemory) {
            const all = [...this._memoryStore.sessions].sort((a, b) => b.updatedAt - a.updatedAt);
            if (includeArchived) return all;
            return all.filter(s => !s.isArchived);
        }

        const all = await this.db.getAllFromIndex('sessions', 'updatedAt');
        if (includeArchived) {
            return all.reverse();
        }
        return all.filter(s => !s.isArchived).reverse();
    }

    async archiveSession(id) {
        return this.updateSession(id, { isArchived: true });
    }

    async deleteSession(id) {
        if (!this.db) await this.init();

        // Delete all messages for this session
        const messages = await this.getSessionMessages(id);
        const tx = this.db.transaction('messages', 'readwrite');
        for (const msg of messages) {
            await tx.store.delete(msg.id);
        }
        await tx.done;

        // Delete session
        await this.db.delete('sessions', id);

        // If current session was deleted, create a new one
        if (localStorage.getItem('currentSessionId') === id) {
            localStorage.removeItem('currentSessionId');
            await this.createSession();
        }
    }

    async switchSession(id) {
        if (!this.db) await this.init();
        const session = await this.getSession(id);
        if (session) {
            localStorage.setItem('currentSessionId', id);
            return session;
        }
        return null;
    }

    // ========== MESSAGE MANAGEMENT ==========

    async addMessage(role, content, sessionId = null) {
        if (!this.db && !this._inMemory) await this.init();

        const session = sessionId
            ? await this.getSession(sessionId)
            : await this.getCurrentSession();

        const message = {
            id: this._inMemory ? Date.now() : undefined,
            sessionId: session.id,
            role,
            content,
            timestamp: Date.now()
        };

        if (this._inMemory) {
            this._memoryStore.messages.push(message);
            console.log('[MemoryCore] Added message (in-memory):', message.id);
            return message;
        }

        const id = await this.db.add('messages', message);
        await this.updateSession(session.id, {});
        return { ...message, id };
    }

    async getSessionMessages(sessionId, limit = 100) {
        if (!this.db && !this._inMemory) await this.init();

        if (this._inMemory) {
            return this._memoryStore.messages
                .filter(m => m.sessionId === sessionId)
                .sort((a, b) => a.timestamp - b.timestamp)
                .slice(-limit);
        }

        const all = await this.db.getAllFromIndex('messages', 'sessionId', sessionId);
        return all.sort((a, b) => a.timestamp - b.timestamp).slice(-limit);
    }

    async getHistory(limit = 50) {
        if (!this.db && !this._inMemory) await this.init();
        const session = await this.getCurrentSession();
        return this.getSessionMessages(session.id, limit);
    }

    async updateMessage(id, newContent) {
        if (!this.db) await this.init();
        const tx = this.db.transaction('messages', 'readwrite');
        const message = await tx.store.get(id);
        if (message) {
            message.content = newContent;
            message.editedAt = Date.now();
            await tx.store.put(message);
        }
        await tx.done;
        return message;
    }

    async deleteMessagesAfter(messageId) {
        if (!this.db) await this.init();

        // Get the message to find its timestamp
        const targetMsg = await this.db.get('messages', messageId);
        if (!targetMsg) return [];

        // Get all messages for this session after this timestamp
        const allMessages = await this.getSessionMessages(targetMsg.sessionId);
        const toDelete = allMessages.filter(m => m.timestamp > targetMsg.timestamp);

        const tx = this.db.transaction('messages', 'readwrite');
        for (const msg of toDelete) {
            await tx.store.delete(msg.id);
        }
        await tx.done;

        return toDelete.map(m => m.id);
    }

    async clearCurrentSession() {
        if (!this.db) await this.init();
        const session = await this.getCurrentSession();
        const messages = await this.getSessionMessages(session.id);

        const tx = this.db.transaction('messages', 'readwrite');
        for (const msg of messages) {
            await tx.store.delete(msg.id);
        }
        await tx.done;
    }

    // ========== LEGACY COMPATIBILITY ==========

    async clearMemory() {
        return this.clearCurrentSession();
    }

    // ========== MEMORY BANK (Long-term Memory) ==========

    async addMemory(key, value) {
        if (!this.db) await this.init();
        const memory = {
            key,
            value,
            createdAt: Date.now()
        };
        const id = await this.db.add('memory', memory);
        return { ...memory, id };
    }

    async getMemories() {
        if (!this.db && !this._inMemory) await this.init();
        if (this._inMemory) {
            return this._memoryStore.memory || [];
        }
        return this.db.getAll('memory');
    }

    async updateMemory(id, updates) {
        if (!this.db) await this.init();
        const tx = this.db.transaction('memory', 'readwrite');
        const memory = await tx.store.get(id);
        if (memory) {
            const updated = { ...memory, ...updates };
            await tx.store.put(updated);
            await tx.done;
            return updated;
        }
        await tx.done;
        return null;
    }

    async deleteMemory(id) {
        if (!this.db) await this.init();
        await this.db.delete('memory', id);
    }

    async getMemoriesAsText() {
        const memories = await this.getMemories();
        if (memories.length === 0) return '';
        const lines = memories.map(m => `・${m.key}: ${m.value}`);
        return `\n\n【アラスターの記憶】\n${lines.join('\n')}`;
    }

    // ========== KNOWLEDGE BASE (Custom Context) ==========

    async addKnowledge(title, content) {
        if (!this.db) await this.init();
        const knowledge = {
            title,
            content,
            isActive: true,
            createdAt: Date.now()
        };
        const id = await this.db.add('knowledge', knowledge);
        return { ...knowledge, id };
    }

    async getKnowledge() {
        if (!this.db && !this._inMemory) await this.init();
        if (this._inMemory) {
            return this._memoryStore.knowledge || [];
        }
        return this.db.getAll('knowledge');
    }

    async getActiveKnowledge() {
        if (!this.db && !this._inMemory) await this.init();
        if (this._inMemory) {
            return (this._memoryStore.knowledge || []).filter(k => k.isActive);
        }
        const all = await this.db.getAll('knowledge');
        return all.filter(k => k.isActive);
    }

    async toggleKnowledge(id) {
        if (!this.db) await this.init();
        const tx = this.db.transaction('knowledge', 'readwrite');
        const knowledge = await tx.store.get(id);
        if (knowledge) {
            knowledge.isActive = !knowledge.isActive;
            await tx.store.put(knowledge);
        }
        await tx.done;
        return knowledge;
    }

    async deleteKnowledge(id) {
        if (!this.db) await this.init();
        await this.db.delete('knowledge', id);
    }

    async getKnowledgeAsText() {
        const activeKnowledge = await this.getActiveKnowledge();
        if (activeKnowledge.length === 0) return '';
        const sections = activeKnowledge.map(k => `【${k.title}】\n${k.content}`);
        return `\n\n【追加設定】\n${sections.join('\n\n')}`;
    }
}

export default new MemoryCore();
