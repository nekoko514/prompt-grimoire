import React, { useState, useEffect } from 'react';
import MemoryCore from '../utils/MemoryCore';
import '../styles/brain-vault.css';

const BrainVault = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('memory');
    const [memories, setMemories] = useState([]);
    const [knowledge, setKnowledge] = useState([]);

    // Memory form
    const [memKey, setMemKey] = useState('');
    const [memValue, setMemValue] = useState('');

    // Knowledge form
    const [knowledgeTitle, setKnowledgeTitle] = useState('');
    const [knowledgeContent, setKnowledgeContent] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const mems = await MemoryCore.getMemories();
        const knows = await MemoryCore.getKnowledge();
        setMemories(mems);
        setKnowledge(knows);
    };

    // ========== MEMORY HANDLERS ==========
    const handleAddMemory = async () => {
        if (!memKey.trim() || !memValue.trim()) return;
        await MemoryCore.addMemory(memKey.trim(), memValue.trim());
        setMemKey('');
        setMemValue('');
        await loadData();
    };

    const handleDeleteMemory = async (id) => {
        await MemoryCore.deleteMemory(id);
        await loadData();
    };

    // ========== KNOWLEDGE HANDLERS ==========
    const handleAddKnowledge = async () => {
        if (!knowledgeTitle.trim() || !knowledgeContent.trim()) return;
        await MemoryCore.addKnowledge(knowledgeTitle.trim(), knowledgeContent.trim());
        setKnowledgeTitle('');
        setKnowledgeContent('');
        await loadData();
    };

    const handleToggleKnowledge = async (id) => {
        await MemoryCore.toggleKnowledge(id);
        await loadData();
    };

    const handleDeleteKnowledge = async (id) => {
        await MemoryCore.deleteKnowledge(id);
        await loadData();
    };

    return (
        <div className="brain-vault-overlay" onClick={onClose}>
            <div className="brain-vault" onClick={e => e.stopPropagation()}>
                <div className="vault-header">
                    <h2>🧠 Brain Vault</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="vault-tabs">
                    <button
                        className={activeTab === 'memory' ? 'active' : ''}
                        onClick={() => setActiveTab('memory')}
                    >
                        📝 記憶 ({memories.length})
                    </button>
                    <button
                        className={activeTab === 'knowledge' ? 'active' : ''}
                        onClick={() => setActiveTab('knowledge')}
                    >
                        📚 ナレッジ ({knowledge.length})
                    </button>
                </div>

                <div className="vault-content">
                    {activeTab === 'memory' && (
                        <div className="memory-section">
                            <p className="section-desc">
                                アラスターに覚えておいてほしい情報を追加します。<br />
                                例: 「好きな食べ物」→「苺のショートケーキ」
                            </p>

                            <div className="add-form">
                                <input
                                    type="text"
                                    placeholder="項目名（例: 好きな食べ物）"
                                    value={memKey}
                                    onChange={e => setMemKey(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="内容（例: 苺のショートケーキ）"
                                    value={memValue}
                                    onChange={e => setMemValue(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddMemory()}
                                />
                                <button onClick={handleAddMemory}>追加</button>
                            </div>

                            <div className="item-list">
                                {memories.length === 0 && (
                                    <p className="empty-msg">まだ記憶がありません</p>
                                )}
                                {memories.map(mem => (
                                    <div key={mem.id} className="item">
                                        <div className="item-content">
                                            <span className="item-key">{mem.key}</span>
                                            <span className="item-value">{mem.value}</span>
                                        </div>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDeleteMemory(mem.id)}
                                        >🗑️</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'knowledge' && (
                        <div className="knowledge-section">
                            <p className="section-desc">
                                カスタム設定やシナリオを追加できます。<br />
                                有効/無効を切り替えることで、状況に応じて使い分けられます。
                            </p>

                            <div className="add-form knowledge-form">
                                <input
                                    type="text"
                                    placeholder="タイトル（例: 今日のシチュエーション）"
                                    value={knowledgeTitle}
                                    onChange={e => setKnowledgeTitle(e.target.value)}
                                />
                                <textarea
                                    placeholder="内容（設定やシナリオを記入...）"
                                    value={knowledgeContent}
                                    onChange={e => setKnowledgeContent(e.target.value)}
                                    rows={4}
                                />
                                <button onClick={handleAddKnowledge}>追加</button>
                            </div>

                            <div className="item-list">
                                {knowledge.length === 0 && (
                                    <p className="empty-msg">まだナレッジがありません</p>
                                )}
                                {knowledge.map(k => (
                                    <div key={k.id} className={`item knowledge-item ${k.isActive ? 'active' : 'inactive'}`}>
                                        <div className="item-header">
                                            <button
                                                className="toggle-btn"
                                                onClick={() => handleToggleKnowledge(k.id)}
                                            >
                                                {k.isActive ? '✅' : '⬜'}
                                            </button>
                                            <span className="item-title">{k.title}</span>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDeleteKnowledge(k.id)}
                                            >🗑️</button>
                                        </div>
                                        <div className="item-body">
                                            {k.content.substring(0, 150)}
                                            {k.content.length > 150 && '...'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BrainVault;
