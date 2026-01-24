import React, { useState, useEffect } from 'react';
import '../styles/writing-desk.css';

const WritingDesk = () => {
    const [note, setNote] = useState('');
    const [status, setStatus] = useState('');
    const [exportFormat, setExportFormat] = useState('txt');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        const savedNote = localStorage.getItem('guest_note');
        if (savedNote) setNote(savedNote);
    }, []);

    const handleChange = (e) => {
        const text = e.target.value;
        setNote(text);
        localStorage.setItem('guest_note', text);
        setStatus('Auto-saved...');
        setTimeout(() => setStatus(''), 1000);
    };

    const handleDeleteClick = () => {
        if (!note.trim()) {
            setStatus('Nothing to delete');
            setTimeout(() => setStatus(''), 2000);
            return;
        }
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        setNote('');
        localStorage.removeItem('guest_note');
        setStatus('Deleted!');
        setTimeout(() => setStatus(''), 2000);
        setShowDeleteConfirm(false);
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    const handleImportClick = () => {
        document.getElementById('desk-file-import').click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            setNote(text);
            localStorage.setItem('guest_note', text);
            setStatus('Imported!');
            setTimeout(() => setStatus(''), 2000);
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleExport = () => {
        const element = document.createElement("a");
        let mimeType = 'text/plain';
        let content = note;
        let extension = exportFormat;

        if (exportFormat === 'md') {
            mimeType = 'text/markdown';
        } else if (exportFormat === 'json') {
            mimeType = 'application/json';
            content = JSON.stringify({
                date: new Date().toISOString(),
                content: note,
                author: "Guest"
            }, null, 2);
        } else if (exportFormat === 'html') {
            mimeType = 'text/html';
            content = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body { background: #0a0505; color: #d0c0c0; font-family: serif; padding: 40px; }
h1 { color: #d91c1c; border-bottom: 1px solid #333; }
.content { white-space: pre-wrap; line-height: 1.6; }
</style>
</head>
<body>
<h1>Guest Room Note</h1>
<div class="content">${note}</div>
</body>
</html>`;
        }

        const file = new Blob([content], { type: mimeType });
        element.href = URL.createObjectURL(file);

        // Date-stamped filename
        const date = new Date().toISOString().slice(0, 10);
        element.download = `guest_note_${date}.${extension}`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        URL.revokeObjectURL(element.href);
    };

    return (
        <div className="writing-desk">
            <div className="desk-header">
                <div className="desk-title-group">
                    <h2>Guest Room Writing Desk</h2>
                    <span className="save-status">{status}</span>
                </div>
                <div className="desk-controls">
                    <select
                        className="desk-select"
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                    >
                        <option value="txt">.TXT</option>
                        <option value="md">.MD</option>
                        <option value="html">.HTML</option>
                        <option value="json">.JSON</option>
                    </select>
                    <button className="desk-btn" onClick={handleImportClick} title="Import Note">📥 IMPORT</button>
                    <button className="desk-btn" onClick={handleExport} title="Save Note">📤 EXPORT</button>
                    <button className="desk-btn delete-btn" onClick={handleDeleteClick} title="Delete Note">🗑️ DELETE</button>
                    <input
                        type="file"
                        id="desk-file-import"
                        style={{ display: 'none' }}
                        accept=".txt,.md"
                        onChange={handleFileChange}
                    />
                </div>
            </div>
            <div className="paper-container">
                <textarea
                    className="desk-textarea"
                    placeholder="Dearest Radio Demon, I am writing to you regarding..."
                    value={note}
                    onChange={handleChange}
                />
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="confirm-overlay">
                    <div className="confirm-modal">
                        <p>本当に削除しますか？</p>
                        <p className="confirm-warning">この操作は取り消せません。</p>
                        <div className="confirm-buttons">
                            <button className="confirm-btn cancel" onClick={cancelDelete}>キャンセル</button>
                            <button className="confirm-btn delete" onClick={confirmDelete}>削除する</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WritingDesk;

