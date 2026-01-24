import React, { useState, useEffect } from 'react';
import '../styles/diary-room.css';

const DiaryRoom = () => {
    const [entries, setEntries] = useState({});
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentEntry, setCurrentEntry] = useState('');
    const [currentMood, setCurrentMood] = useState('✨');
    const [viewMode, setViewMode] = useState('write'); // 'write' or 'browse'
    const [isSaving, setIsSaving] = useState(false);

    const moods = [
        { emoji: '✨', label: '輝き', color: '#ffd700' },
        { emoji: '🌙', label: '静寂', color: '#6a5acd' },
        { emoji: '🔥', label: '情熱', color: '#ff4500' },
        { emoji: '🌸', label: '穏やか', color: '#ffb6c1' },
        { emoji: '💀', label: '暗黒', color: '#444' },
        { emoji: '🌊', label: '悲哀', color: '#4682b4' },
        { emoji: '⚡', label: '興奮', color: '#ff6600' },
        { emoji: '🍷', label: '酩酊', color: '#8b0000' },
    ];

    useEffect(() => {
        const saved = localStorage.getItem('dream_journal');
        if (saved) {
            setEntries(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {
        // Load entry for selected date
        if (entries[selectedDate]) {
            setCurrentEntry(entries[selectedDate].text || '');
            setCurrentMood(entries[selectedDate].mood || '✨');
        } else {
            setCurrentEntry('');
            setCurrentMood('✨');
        }
    }, [selectedDate, entries]);

    const saveEntry = () => {
        if (!currentEntry.trim()) return;

        setIsSaving(true);
        const updatedEntries = {
            ...entries,
            [selectedDate]: {
                text: currentEntry,
                mood: currentMood,
                updatedAt: new Date().toLocaleTimeString()
            }
        };
        setEntries(updatedEntries);
        localStorage.setItem('dream_journal', JSON.stringify(updatedEntries));

        setTimeout(() => setIsSaving(false), 1000);
    };

    const deleteEntry = (date) => {
        const updated = { ...entries };
        delete updated[date];
        setEntries(updated);
        localStorage.setItem('dream_journal', JSON.stringify(updated));
        if (date === selectedDate) {
            setCurrentEntry('');
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short'
        });
    };

    const sortedDates = Object.keys(entries).sort((a, b) => new Date(b) - new Date(a));

    return (
        <div className="diary-room">
            {/* Floating dream particles */}
            <div className="dream-particles">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="dream-particle" style={{
                        left: `${10 + i * 12}%`,
                        animationDelay: `${i * 0.7}s`,
                        animationDuration: `${6 + i % 3}s`
                    }}>✦</div>
                ))}
            </div>

            <header className="diary-header">
                <h2>Dream Journal</h2>
                <p>闇夜に浮かぶ、貴方の記憶...</p>
                <div className="view-toggle">
                    <button
                        className={`toggle-btn ${viewMode === 'write' ? 'active' : ''}`}
                        onClick={() => setViewMode('write')}
                    >
                        ✍️ 執筆
                    </button>
                    <button
                        className={`toggle-btn ${viewMode === 'browse' ? 'active' : ''}`}
                        onClick={() => setViewMode('browse')}
                    >
                        📚 回顧
                    </button>
                </div>
            </header>

            {viewMode === 'write' ? (
                <div className="write-section">
                    <div className="date-selector">
                        <button
                            className="date-nav"
                            onClick={() => {
                                const d = new Date(selectedDate);
                                d.setDate(d.getDate() - 1);
                                setSelectedDate(d.toISOString().split('T')[0]);
                            }}
                        >◀</button>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="date-input"
                        />
                        <button
                            className="date-nav"
                            onClick={() => {
                                const d = new Date(selectedDate);
                                d.setDate(d.getDate() + 1);
                                setSelectedDate(d.toISOString().split('T')[0]);
                            }}
                        >▶</button>
                    </div>

                    <div className="mood-selector">
                        <span className="mood-label">今宵の気分:</span>
                        <div className="mood-options">
                            {moods.map(m => (
                                <button
                                    key={m.emoji}
                                    className={`mood-btn ${currentMood === m.emoji ? 'active' : ''}`}
                                    style={{
                                        borderColor: currentMood === m.emoji ? m.color : 'transparent',
                                        boxShadow: currentMood === m.emoji ? `0 0 10px ${m.color}` : 'none'
                                    }}
                                    onClick={() => setCurrentMood(m.emoji)}
                                    title={m.label}
                                >
                                    {m.emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="journal-page">
                        <div className="page-decoration top-left">❧</div>
                        <div className="page-decoration top-right">❧</div>
                        <textarea
                            className="journal-textarea"
                            placeholder="今夜の夢を綴りなさい..."
                            value={currentEntry}
                            onChange={(e) => setCurrentEntry(e.target.value)}
                        />
                        <div className="page-decoration bottom-left">❧</div>
                        <div className="page-decoration bottom-right">❧</div>
                    </div>

                    <div className="journal-actions">
                        <span className="char-count">{currentEntry.length} 文字</span>
                        <button
                            className={`save-btn ${isSaving ? 'saving' : ''}`}
                            onClick={saveEntry}
                            disabled={!currentEntry.trim()}
                        >
                            {isSaving ? '保存中...' : '📜 記録する'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="browse-section">
                    {sortedDates.length === 0 ? (
                        <div className="empty-journal">
                            <p>まだ記録がありません...</p>
                            <p className="empty-hint">執筆モードで最初の日記を書きましょう</p>
                        </div>
                    ) : (
                        <div className="entries-list">
                            {sortedDates.map(date => (
                                <div
                                    key={date}
                                    className={`entry-card ${selectedDate === date ? 'selected' : ''}`}
                                    onClick={() => {
                                        setSelectedDate(date);
                                        setViewMode('write');
                                    }}
                                >
                                    <div className="entry-header">
                                        <span className="entry-mood">{entries[date].mood}</span>
                                        <span className="entry-date">{formatDate(date)}</span>
                                    </div>
                                    <p className="entry-preview">
                                        {entries[date].text.substring(0, 100)}
                                        {entries[date].text.length > 100 && '...'}
                                    </p>
                                    <div className="entry-footer">
                                        <span className="entry-time">最終更新: {entries[date].updatedAt}</span>
                                        <button
                                            className="delete-entry-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('この記録を消去しますか？')) {
                                                    deleteEntry(date);
                                                }
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DiaryRoom;
