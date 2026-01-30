import React, { useState, useEffect } from 'react';

import '../styles/archives.css';

const RadioArchives = ({ onClose }) => {
    const [archives, setArchives] = useState([]);
    const [view, setView] = useState('list'); // list, edit, view

    const [currentTape, setCurrentTape] = useState({ id: null, title: '', content: '', date: '' });

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState({ show: false, id: null, type: null });

    // Load from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem('radio_archives');
        if (saved) {
            setArchives(JSON.parse(saved));
        }
    }, []);

    // Save to LocalStorage
    const saveArchives = (newArchives) => {
        setArchives(newArchives);
        localStorage.setItem('radio_archives', JSON.stringify(newArchives));
    };

    const handeCreate = () => {
        setCurrentTape({ id: null, title: '', content: '', date: new Date().toLocaleString() });
        setView('edit');
    };

    const handleEdit = (tape) => {
        setCurrentTape(tape);
        setView('edit');
    };

    const handleImportClick = () => {
        document.getElementById('file-import').click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            // Truncate filename for title if needed, or just use filename
            const title = file.name.replace(/\.[^/.]+$/, ""); // remove extension

            setCurrentTape({
                id: null,
                title: title,
                content: content,
                date: new Date().toLocaleString()
            });
            setView('edit');
        };
        reader.readAsText(file);
        // Reset input so same file can be selected again if needed
        e.target.value = '';
    };

    const handleSave = () => {
        if (!currentTape.title) currentTape.title = "Untitled Broadcast";

        let updatedArchives;
        if (currentTape.id) {
            updatedArchives = archives.map(a => a.id === currentTape.id ? { ...currentTape, date: new Date().toLocaleString() } : a);
        } else {
            const newTape = { ...currentTape, id: Date.now(), date: new Date().toLocaleString() };
            updatedArchives = [newTape, ...archives];
        }

        saveArchives(updatedArchives);
        setView('list');
    };

    // Show confirmation modal
    const showDeleteConfirm = (id, e) => {
        e.stopPropagation();
        setConfirmModal({ show: true, id: id, type: 'delete' });
    };

    // Actually delete after confirmation
    const confirmDelete = () => {
        const updated = archives.filter(a => a.id !== confirmModal.id);
        saveArchives(updated);
        if (view !== 'list') setView('list');
        setConfirmModal({ show: false, id: null, type: null });
    };

    const handleExport = (e, tape) => {
        e.stopPropagation();
        const element = document.createElement("a");
        const file = new Blob([tape.content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        // Sanitize filename
        const safeTitle = tape.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        element.download = `${safeTitle}.txt`;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
        document.body.removeChild(element);
    };



    return (
        <div className="archives-container">
            <div className="archives-header">
                <h2>THE VAULT</h2>
            </div>

            {/* Confirmation Modal */}
            {confirmModal.show && (
                <>
                    <div className="confirm-overlay" onClick={() => setConfirmModal({ show: false, id: null, type: null })}></div>
                    <div className="confirm-modal">
                        <p>このテープを削除しますか？</p>
                        <div className="confirm-buttons">
                            <button
                                className="confirm-cancel"
                                onClick={() => setConfirmModal({ show: false, id: null, type: null })}
                            >
                                キャンセル
                            </button>
                            <button className="confirm-delete" onClick={confirmDelete}>
                                削除する
                            </button>
                        </div>
                    </div>
                </>
            )}



            <div className="archives-divider"></div>

            <h3 className="radio-archives-title">📻 Radio Archives</h3>

            {view === 'list' && (
                <div className="archives-list">
                    <div className="list-controls">
                        <button className="new-tape-btn" onClick={handeCreate}>
                            + RECORD NEW
                        </button>
                        <button className="import-btn" onClick={handleImportClick}>
                            📥 IMPORT FILE
                        </button>
                        <input
                            type="file"
                            id="file-import"
                            style={{ display: 'none' }}
                            accept=".txt,.json,.md"
                            onChange={handleFileChange}
                        />
                    </div>

                    {archives.length === 0 ? (
                        <div className="empty-state">No tapes found in the vault...</div>
                    ) : (
                        archives.map(tape => (
                            <div key={tape.id} className="tape-item" onClick={() => handleEdit(tape)}>
                                <div className="tape-label">
                                    <span className="tape-date">{tape.date}</span>
                                    <span className="tape-title">{tape.title}</span>
                                </div>
                                <div className="tape-actions">
                                    <button className="export-btn" onClick={(e) => handleExport(e, tape)} title="Export Tape">
                                        📤
                                    </button>
                                    <button className="delete-btn" onClick={(e) => showDeleteConfirm(tape.id, e)}>
                                        DELETE
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {view === 'edit' && (
                <div className="tape-editor">
                    <input
                        className="tape-title-input"
                        placeholder="Broadcast Title..."
                        value={currentTape.title}
                        onChange={(e) => setCurrentTape({ ...currentTape, title: e.target.value })}
                    />
                    <textarea
                        className="tape-content-input"
                        placeholder="Paste session logs here..."
                        value={currentTape.content}
                        onChange={(e) => setCurrentTape({ ...currentTape, content: e.target.value })}
                    />
                    <div className="editor-controls">
                        <button onClick={() => setView('list')} className="cancel-btn">CANCEL</button>
                        <button onClick={handleSave} className="save-btn">SAVE TAPE</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RadioArchives;
