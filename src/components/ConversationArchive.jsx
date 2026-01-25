import React, { useState, useEffect } from 'react';
import '../styles/conversation-archive.css';

const ConversationArchive = () => {
    const [entries, setEntries] = useState([]);
    const [censorWords, setCensorWords] = useState([]);
    const [settings, setSettings] = useState({
        userName: 'ユーザー',
        personaName: 'アラスター',
        userIcon: '👤',
        personaIcon: '🎭',
        userImage: null,
        personaImage: null,
        censorChar: '🌹'
    });
    const [isAdding, setIsAdding] = useState(false);
    const [newUserMessage, setNewUserMessage] = useState('');
    const [newPersonaMessage, setNewPersonaMessage] = useState('');
    const [newCensorWord, setNewCensorWord] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editUserMessage, setEditUserMessage] = useState('');
    const [editPersonaMessage, setEditPersonaMessage] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    // Load data from localStorage
    useEffect(() => {
        const savedEntries = localStorage.getItem('conversation_archive');
        const savedWords = localStorage.getItem('censor_words');
        const savedSettings = localStorage.getItem('archive_settings');

        if (savedEntries) setEntries(JSON.parse(savedEntries));
        if (savedWords) setCensorWords(JSON.parse(savedWords));
        if (savedSettings) setSettings(JSON.parse(savedSettings));
    }, []);

    // Save functions
    const saveEntries = (data) => {
        localStorage.setItem('conversation_archive', JSON.stringify(data));
        setEntries(data);
    };

    const saveCensorWords = (data) => {
        localStorage.setItem('censor_words', JSON.stringify(data));
        setCensorWords(data);
    };

    const saveSettings = (data) => {
        localStorage.setItem('archive_settings', JSON.stringify(data));
        setSettings(data);
    };

    // Handle image upload
    const handleImageUpload = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        // Limit file size to 500KB
        if (file.size > 500 * 1024) {
            alert('画像サイズは500KB以下にしてください');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target.result;
            if (type === 'user') {
                saveSettings({ ...settings, userImage: imageData });
            } else {
                saveSettings({ ...settings, personaImage: imageData });
            }
        };
        reader.readAsDataURL(file);
    };

    // Clear image
    const clearImage = (type) => {
        if (type === 'user') {
            saveSettings({ ...settings, userImage: null });
        } else {
            saveSettings({ ...settings, personaImage: null });
        }
    };

    // Render avatar (image or emoji)
    const renderAvatar = (type, size = 'normal') => {
        const image = type === 'user' ? settings.userImage : settings.personaImage;
        const icon = type === 'user' ? settings.userIcon : settings.personaIcon;
        const sizeClass = size === 'small' ? 'avatar-small' : 'avatar-normal';

        if (image) {
            return <img src={image} alt="" className={`avatar-image ${sizeClass}`} />;
        }
        return <span className={`avatar-emoji ${sizeClass}`}>{icon}</span>;
    };

    // Apply censorship to text
    const applyCensor = (text) => {
        if (!text || censorWords.length === 0) return text;

        let result = text;
        censorWords.forEach(word => {
            if (word.trim()) {
                const regex = new RegExp(escapeRegExp(word), 'gi');
                const replacement = settings.censorChar.repeat(Math.max(1, Math.ceil(word.length / 2)));
                result = result.replace(regex, replacement);
            }
        });
        return result;
    };

    // Escape special regex characters
    const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // Add new entry
    const addEntry = () => {
        if (!newUserMessage.trim() && !newPersonaMessage.trim()) return;

        const newEntry = {
            id: Date.now(),
            userMessage: newUserMessage.trim(),
            personaMessage: newPersonaMessage.trim(),
            createdAt: new Date().toLocaleDateString('ja-JP')
        };

        const updated = [newEntry, ...entries];
        saveEntries(updated);
        setNewUserMessage('');
        setNewPersonaMessage('');
        setIsAdding(false);
    };

    // Delete entry
    const deleteEntry = (id) => {
        if (!confirm('この会話を削除しますか？')) return;
        const updated = entries.filter(e => e.id !== id);
        saveEntries(updated);
    };

    // Start editing
    const startEdit = (entry) => {
        setEditingId(entry.id);
        setEditUserMessage(entry.userMessage);
        setEditPersonaMessage(entry.personaMessage);
    };

    // Save edit
    const saveEdit = (id) => {
        const updated = entries.map(e =>
            e.id === id ? { ...e, userMessage: editUserMessage, personaMessage: editPersonaMessage } : e
        );
        saveEntries(updated);
        setEditingId(null);
    };

    // Add censor word
    const addCensorWord = () => {
        if (!newCensorWord.trim()) return;
        if (censorWords.includes(newCensorWord.trim())) return;

        const updated = [...censorWords, newCensorWord.trim()];
        saveCensorWords(updated);
        setNewCensorWord('');
    };

    // Remove censor word
    const removeCensorWord = (word) => {
        const updated = censorWords.filter(w => w !== word);
        saveCensorWords(updated);
    };

    // Copy to clipboard with censorship applied
    const copyEntry = async (entry) => {
        const text = `${settings.userIcon} ${settings.userName}:\n${applyCensor(entry.userMessage)}\n\n${settings.personaIcon} ${settings.personaName}:\n${applyCensor(entry.personaMessage)}`;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(entry.id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    return (
        <div className="conversation-archive">
            <header className="archive-header">
                <h2>📚 Conversation Archive</h2>
                <p>セッションの断片を記録する書庫</p>
            </header>

            {/* Settings Toggle */}
            <button
                className="settings-toggle"
                onClick={() => setShowSettings(!showSettings)}
            >
                ⚙️ 設定 {showSettings ? '▲' : '▼'}
            </button>

            {/* Settings Panel */}
            {showSettings && (
                <div className="settings-panel">
                    {/* User Settings */}
                    <div className="avatar-settings-group">
                        <div className="avatar-preview">
                            {renderAvatar('user')}
                        </div>
                        <div className="avatar-controls">
                            <label>ユーザー</label>
                            <input
                                type="text"
                                value={settings.userName}
                                onChange={(e) => saveSettings({ ...settings, userName: e.target.value })}
                                placeholder="ユーザー"
                            />
                            <div className="avatar-upload-row">
                                <input
                                    type="text"
                                    value={settings.userIcon}
                                    onChange={(e) => saveSettings({ ...settings, userIcon: e.target.value || '👤' })}
                                    placeholder="👤"
                                    className="icon-input"
                                />
                                <label className="upload-btn">
                                    📷 画像
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'user')}
                                        hidden
                                    />
                                </label>
                                {settings.userImage && (
                                    <button className="clear-img-btn" onClick={() => clearImage('user')}>✕</button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Persona Settings */}
                    <div className="avatar-settings-group">
                        <div className="avatar-preview">
                            {renderAvatar('persona')}
                        </div>
                        <div className="avatar-controls">
                            <label>ペルソナ</label>
                            <input
                                type="text"
                                value={settings.personaName}
                                onChange={(e) => saveSettings({ ...settings, personaName: e.target.value })}
                                placeholder="アラスター"
                            />
                            <div className="avatar-upload-row">
                                <input
                                    type="text"
                                    value={settings.personaIcon}
                                    onChange={(e) => saveSettings({ ...settings, personaIcon: e.target.value || '🎭' })}
                                    placeholder="🎭"
                                    className="icon-input"
                                />
                                <label className="upload-btn">
                                    📷 画像
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'persona')}
                                        hidden
                                    />
                                </label>
                                {settings.personaImage && (
                                    <button className="clear-img-btn" onClick={() => clearImage('persona')}>✕</button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="settings-row">
                        <label>伏字マスク:</label>
                        <input
                            type="text"
                            value={settings.censorChar}
                            onChange={(e) => saveSettings({ ...settings, censorChar: e.target.value || '🌹' })}
                            placeholder="🌹"
                            className="censor-char-input"
                        />
                    </div>

                    {/* Censor Words */}
                    <div className="censor-words-section">
                        <label>🚫 伏字ワード:</label>
                        <div className="censor-words-list">
                            {censorWords.map((word, idx) => (
                                <span
                                    key={idx}
                                    className="censor-word-tag"
                                    onClick={() => removeCensorWord(word)}
                                    title="クリックで削除"
                                >
                                    {word} ✕
                                </span>
                            ))}
                            <div className="add-censor-word">
                                <input
                                    type="text"
                                    value={newCensorWord}
                                    onChange={(e) => setNewCensorWord(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addCensorWord()}
                                    placeholder="追加..."
                                />
                                <button onClick={addCensorWord}>+</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add New Entry Button */}
            {!isAdding && (
                <button className="add-entry-btn" onClick={() => setIsAdding(true)}>
                    ✨ 新しい会話を記録
                </button>
            )}

            {/* Add Form */}
            {isAdding && (
                <div className="add-form">
                    <div className="message-input-group">
                        <label>{settings.userIcon} {settings.userName}:</label>
                        <textarea
                            value={newUserMessage}
                            onChange={(e) => setNewUserMessage(e.target.value)}
                            placeholder="ユーザーの発言..."
                            rows={3}
                        />
                    </div>
                    <div className="message-input-group">
                        <label>{settings.personaIcon} {settings.personaName}:</label>
                        <textarea
                            value={newPersonaMessage}
                            onChange={(e) => setNewPersonaMessage(e.target.value)}
                            placeholder="ペルソナの返答..."
                            rows={4}
                        />
                    </div>
                    <div className="form-actions">
                        <button className="cancel-btn" onClick={() => {
                            setIsAdding(false);
                            setNewUserMessage('');
                            setNewPersonaMessage('');
                        }}>
                            キャンセル
                        </button>
                        <button
                            className="save-btn"
                            onClick={addEntry}
                            disabled={!newUserMessage.trim() && !newPersonaMessage.trim()}
                        >
                            📜 保存
                        </button>
                    </div>
                </div>
            )}

            {/* Entries List */}
            <div className="entries-list">
                {entries.length === 0 && !isAdding && (
                    <div className="empty-archive">
                        <p>まだ会話が記録されていません...</p>
                        <p className="hint">「新しい会話を記録」から始めましょう</p>
                    </div>
                )}

                {entries.map(entry => (
                    <div key={entry.id} className="entry-card">
                        <div className="entry-header">
                            <span className="entry-date">📅 {entry.createdAt}</span>
                        </div>

                        {editingId === entry.id ? (
                            <div className="edit-area">
                                <div className="message-input-group">
                                    <label>{settings.userIcon} {settings.userName}:</label>
                                    <textarea
                                        value={editUserMessage}
                                        onChange={(e) => setEditUserMessage(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <div className="message-input-group">
                                    <label>{settings.personaIcon} {settings.personaName}:</label>
                                    <textarea
                                        value={editPersonaMessage}
                                        onChange={(e) => setEditPersonaMessage(e.target.value)}
                                        rows={4}
                                    />
                                </div>
                                <div className="edit-actions">
                                    <button className="cancel-btn" onClick={() => setEditingId(null)}>
                                        キャンセル
                                    </button>
                                    <button className="save-btn" onClick={() => saveEdit(entry.id)}>
                                        保存
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="entry-content">
                                    <div className="message user-message">
                                        <div className="message-header">
                                            {renderAvatar('user', 'small')}
                                            <span className="speaker">{settings.userName}:</span>
                                        </div>
                                        <p>{applyCensor(entry.userMessage)}</p>
                                    </div>
                                    <div className="message persona-message">
                                        <div className="message-header">
                                            {renderAvatar('persona', 'small')}
                                            <span className="speaker">{settings.personaName}:</span>
                                        </div>
                                        <p>{applyCensor(entry.personaMessage)}</p>
                                    </div>
                                </div>

                                <div className="entry-actions">
                                    <button
                                        className={`copy-btn ${copiedId === entry.id ? 'copied' : ''}`}
                                        onClick={() => copyEntry(entry)}
                                    >
                                        {copiedId === entry.id ? '✓ コピー完了!' : '📋 コピー'}
                                    </button>
                                    <button
                                        className="edit-btn"
                                        onClick={() => startEdit(entry)}
                                    >
                                        ✏️ 編集
                                    </button>
                                    <button
                                        className="delete-btn"
                                        onClick={() => deleteEntry(entry.id)}
                                    >
                                        🗑️ 削除
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ConversationArchive;
