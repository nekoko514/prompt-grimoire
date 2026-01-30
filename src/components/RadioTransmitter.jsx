import React, { useState, useEffect, useRef } from 'react';
import MemoryCore from '../utils/MemoryCore';
import RadioFrequency from '../utils/RadioFrequency';
import BrainVault from './BrainVault';
import '../styles/radio-transmitter.css';

const RadioTransmitter = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTransmitting, setIsTransmitting] = useState(false);
    const [currentSession, setCurrentSession] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [showSessionMenu, setShowSessionMenu] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [showBrainVault, setShowBrainVault] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const messagesEndRef = useRef(null);

    // API Key (saved to sessionStorage - cleared when browser closes)
    const [apiKey, setApiKey] = useState(() => {
        return sessionStorage.getItem('geminiApiKey') || '';
    });

    // Save API key to sessionStorage
    useEffect(() => {
        if (apiKey) {
            sessionStorage.setItem('geminiApiKey', apiKey);
            RadioFrequency.setApiKey(apiKey);
        }
    }, [apiKey]);

    // Theme settings (saved to localStorage)
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('radioTheme');
        return saved ? JSON.parse(saved) : {
            textColor: '#ffcccc',
            bgImage: '',
            bgOpacity: 0.3
        };
    });

    // Save theme to localStorage when changed
    useEffect(() => {
        localStorage.setItem('radioTheme', JSON.stringify(theme));
    }, [theme]);

    const updateTheme = (key, value) => {
        setTheme(prev => ({ ...prev, [key]: value }));
    };

    // Initialize session and load history
    useEffect(() => {
        const initSession = async () => {
            await MemoryCore.init();
            const session = await MemoryCore.getCurrentSession();
            setCurrentSession(session);
            await loadMessages(session.id);
            await loadSessions();
        };
        initSession();
    }, []);

    const loadMessages = async (sessionId) => {
        const history = await MemoryCore.getSessionMessages(sessionId, 100);
        setMessages(history);
    };

    const loadSessions = async () => {
        const allSessions = await MemoryCore.listSessions(true);
        setSessions(allSessions);
    };

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleTransmit = async () => {
        if (!input.trim() || isTransmitting) return;

        const userMsg = input.trim();
        setIsTransmitting(true);
        setInput('');

        try {
            const userEntry = await MemoryCore.addMessage('user', userMsg);
            setMessages(prev => [...prev, userEntry]);

            const currentHistory = [...messages, { role: 'user', content: userMsg }];
            const response = await RadioFrequency.transmit(userMsg, currentHistory);

            const aiEntry = await MemoryCore.addMessage('assistant', response);
            setMessages(prev => [...prev, aiEntry]);

            await loadSessions();
        } catch (error) {
            console.error('Transmission error:', error);
            setMessages(prev => [...prev, {
                id: Date.now(),
                role: 'assistant',
                content: `⚠️ エラーが発生しました: ${error.message || 'Unknown error'}`
            }]);
        } finally {
            setIsTransmitting(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleTransmit();
        }
    };

    // ========== SESSION MANAGEMENT ==========

    const handleNewSession = async () => {
        const session = await MemoryCore.createSession();
        setCurrentSession(session);
        setMessages([]);
        await loadSessions();
        setShowSessionMenu(false);
    };

    const handleSwitchSession = async (sessionId) => {
        const session = await MemoryCore.switchSession(sessionId);
        if (session) {
            setCurrentSession(session);
            await loadMessages(sessionId);
        }
        setShowSessionMenu(false);
    };

    const handleDeleteSession = async (sessionId, e) => {
        e.stopPropagation();
        if (!confirm('このセッションを削除しますか？')) return;

        await MemoryCore.deleteSession(sessionId);
        const newSession = await MemoryCore.getCurrentSession();
        setCurrentSession(newSession);
        await loadMessages(newSession.id);
        await loadSessions();
    };

    const handleArchiveSession = async (sessionId, e) => {
        e.stopPropagation();
        await MemoryCore.archiveSession(sessionId);
        await loadSessions();
    };

    // ========== MESSAGE EDITING ==========

    const startEditing = (msg) => {
        if (msg.role !== 'user') return;
        setEditingMessageId(msg.id);
        setEditContent(msg.content);
    };

    const cancelEditing = () => {
        setEditingMessageId(null);
        setEditContent('');
    };

    const handleEditSubmit = async (messageId) => {
        if (!editContent.trim()) return;

        // Update the message
        await MemoryCore.updateMessage(messageId, editContent.trim());

        // Delete all messages after this one
        await MemoryCore.deleteMessagesAfter(messageId);

        // Reload messages
        await loadMessages(currentSession.id);

        // Regenerate response
        const updatedMessages = await MemoryCore.getSessionMessages(currentSession.id);
        setMessages(updatedMessages);

        setEditingMessageId(null);
        setEditContent('');

        // Now regenerate AI response
        setIsTransmitting(true);
        const response = await RadioFrequency.transmit(editContent.trim(), updatedMessages);
        const aiEntry = await MemoryCore.addMessage('assistant', response);
        setMessages(prev => [...prev, aiEntry]);
        setIsTransmitting(false);
    };

    const handleRegenerate = async (messageIndex) => {
        // Find the user message before this AI message
        const aiMsg = messages[messageIndex];
        if (aiMsg.role !== 'assistant') return;

        const userMsgIndex = messageIndex - 1;
        if (userMsgIndex < 0) return;

        const userMsg = messages[userMsgIndex];

        // Delete from AI message onwards
        await MemoryCore.deleteMessagesAfter(userMsg.id);

        // Reload and regenerate
        const history = await MemoryCore.getSessionMessages(currentSession.id);
        setMessages(history);

        setIsTransmitting(true);
        const response = await RadioFrequency.transmit(userMsg.content, history);
        const aiEntry = await MemoryCore.addMessage('assistant', response);
        setMessages(prev => [...prev, aiEntry]);
        setIsTransmitting(false);
    };

    return (
        <div
            className="radio-transmitter"
            style={{ '--theme-text-color': theme.textColor }}
        >
            {/* Background Image Overlay */}
            {theme.bgImage && (
                <div
                    className="bg-overlay"
                    style={{
                        backgroundImage: `url(${theme.bgImage})`,
                        opacity: theme.bgOpacity
                    }}
                />
            )}

            <div className="transmitter-header">
                <div className="header-left">
                    <h2>🎙️ Radio Transmitter</h2>
                    <button
                        className="session-menu-btn"
                        onClick={() => setShowSessionMenu(!showSessionMenu)}
                    >
                        📂 {currentSession?.title || '読み込み中...'}
                    </button>
                </div>
                <div className="header-right">
                    <button className="settings-btn" onClick={() => setShowSettings(!showSettings)}>
                        ⚙️
                    </button>
                    <button className="brain-vault-btn" onClick={() => setShowBrainVault(true)}>
                        🧠
                    </button>
                    <button className="new-session-btn" onClick={handleNewSession}>
                        ✨ 新規
                    </button>
                    <span className="status-light">放送中</span>
                </div>
            </div>

            {/* Session Menu Dropdown */}
            {showSessionMenu && (
                <div className="session-menu">
                    <div className="session-menu-header">セッション一覧</div>
                    <div className="session-list">
                        {sessions.map(session => (
                            <div
                                key={session.id}
                                className={`session-item ${session.id === currentSession?.id ? 'active' : ''} ${session.isArchived ? 'archived' : ''}`}
                                onClick={() => handleSwitchSession(session.id)}
                            >
                                <span className="session-title">
                                    {session.isArchived && '📦 '}
                                    {session.title}
                                </span>
                                <span className="session-date">
                                    {new Date(session.updatedAt).toLocaleDateString('ja-JP')}
                                </span>
                                <div className="session-actions">
                                    {!session.isArchived && (
                                        <button
                                            className="archive-btn"
                                            onClick={(e) => handleArchiveSession(session.id, e)}
                                            title="アーカイブ"
                                        >📦</button>
                                    )}
                                    <button
                                        className="delete-btn"
                                        onClick={(e) => handleDeleteSession(session.id, e)}
                                        title="削除"
                                    >🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="log-display">
                {messages.length === 0 && (
                    <div className="empty-log">
                        <p>*ザザッ...*</p>
                        <p>周波数を合わせてください...</p>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div key={msg.id || index} className={`log-entry ${msg.role}`}>
                        <div className="entry-meta">
                            <span className="binaural-beat">
                                {msg.role === 'user' ? '👤 SIGNAL_IN' : '📻 BROADCAST'}
                            </span>
                            {msg.role === 'user' && (
                                <button
                                    className="edit-btn"
                                    onClick={() => startEditing(msg)}
                                    title="編集"
                                >✏️</button>
                            )}
                            {msg.role === 'assistant' && (
                                <button
                                    className="regenerate-btn"
                                    onClick={() => handleRegenerate(index)}
                                    title="再生成"
                                >🔄</button>
                            )}
                        </div>

                        {editingMessageId === msg.id ? (
                            <div className="edit-area">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="edit-input"
                                />
                                <div className="edit-buttons">
                                    <button onClick={() => handleEditSubmit(msg.id)}>送信 & 再生成</button>
                                    <button onClick={cancelEditing}>キャンセル</button>
                                </div>
                            </div>
                        ) : (
                            <div className="entry-content">
                                {msg.content}
                            </div>
                        )}
                    </div>
                ))}

                {isTransmitting && (
                    <div className="log-entry assistant transmitting">
                        <span className="tuning-text">* チューニング中... *</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="control-panel">
                <textarea
                    className="morse-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="ラジオ・デーモンにメッセージを送信..."
                    rows={1}
                    disabled={currentSession?.isArchived}
                />
                <button
                    className={`transmit-btn ${isTransmitting || currentSession?.isArchived ? 'disabled' : ''}`}
                    onClick={handleTransmit}
                    disabled={isTransmitting || currentSession?.isArchived}
                >
                    {isTransmitting ? '送信中...' : '送信'}
                </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="settings-panel">
                    <h3>⚙️ 設定</h3>

                    <div className="settings-section">
                        <h4>🔑 APIキー</h4>
                        <div className="setting-row">
                            <label>Gemini API Key:</label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                            />
                            <span className={`api-status ${apiKey ? 'active' : ''}`}>
                                {apiKey ? '✅ 設定済み' : '⚠️ 未設定'}
                            </span>
                        </div>
                    </div>

                    <div className="settings-section">
                        <h4>🎨 表示設定</h4>
                        <div className="setting-row">
                            <label>文字色:</label>
                            <input
                                type="color"
                                value={theme.textColor}
                                onChange={(e) => updateTheme('textColor', e.target.value)}
                            />
                            <span style={{ color: theme.textColor }}>{theme.textColor}</span>
                        </div>

                        <div className="setting-row">
                            <label>背景画像:</label>
                            <div className="bg-image-options">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                                updateTheme('bgImage', event.target.result);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                <span className="or-text">または URL:</span>
                                <input
                                    type="text"
                                    value={theme.bgImage.startsWith('data:') ? '' : theme.bgImage}
                                    onChange={(e) => updateTheme('bgImage', e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                />
                                {theme.bgImage && (
                                    <button
                                        className="clear-bg-btn"
                                        onClick={() => updateTheme('bgImage', '')}
                                    >
                                        ✕ 削除
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="setting-row">
                            <label>背景の透明度: {Math.round(theme.bgOpacity * 100)}%</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={theme.bgOpacity}
                                onChange={(e) => updateTheme('bgOpacity', parseFloat(e.target.value))}
                            />
                        </div>

                        <button
                            className="reset-theme-btn"
                            onClick={() => setTheme({
                                textColor: '#ffcccc',
                                bgImage: '',
                                bgOpacity: 0.3
                            })}
                        >
                            🔄 デフォルトに戻す
                        </button>
                    </div>
                </div>
            )}

            {/* Brain Vault Modal */}
            {showBrainVault && (
                <BrainVault onClose={() => setShowBrainVault(false)} />
            )}
        </div>
    );
};

export default RadioTransmitter;
