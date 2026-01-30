import React, { useState } from 'react';
import { BackupManager } from '../utils/BackupManager';
import '../styles/system-room.css';

const SystemRoom = ({ onClose }) => {

    const handleSystemBackup = () => {
        BackupManager.downloadBackup();
    };

    const handleSystemRestore = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!window.confirm("⚠️ 警告: バックアップを復元すると、現在のデータ（メモ、契約、カレンダーなど）がすべて上書きされます。\n\n本当に復元しますか？")) {
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                if (BackupManager.restoreBackup(json)) {
                    alert("✅ 復元完了！ページをリロードします。");
                    window.location.reload();
                } else {
                    alert("❌ 復元に失敗しました。ファイルが無効です。");
                }
            } catch (err) {
                console.error(err);
                alert("❌ バックアップファイルの読み込みエラー");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div className="system-room">
            <div className="system-header">
                <h2>⚙️ System Control</h2>
                {onClose && <button className="close-btn" onClick={onClose}>×</button>}
            </div>

            <div className="system-content">

                {/* Data Management Section */}
                <div className="system-section">
                    <h3>📦 Data Management</h3>
                    <p className="section-desc">
                        アプリケーションの全データをバックアップ・復元します。<br />
                        重要なデータの損失を防ぐため、定期的なバックアップを推奨します。
                    </p>

                    <div className="system-controls">
                        <button className="action-btn backup" onClick={handleSystemBackup}>
                            💾 BACKUP ALL DATA (Full System)
                        </button>

                        <label className="action-btn restore">
                            <span className="restore-label">
                                ♻️ RESTORE DATA from File
                            </span>
                            <input
                                type="file"
                                style={{ display: 'none' }}
                                accept=".json"
                                onChange={handleSystemRestore}
                            />
                        </label>
                    </div>
                </div>

                {/* Additional system settings can go here */}
                <div className="system-section">
                    <h3>🔧 App Info</h3>
                    <p className="section-desc">
                        Prompt Grimoire v1.0<br />
                        System Integrity: Stable
                    </p>
                </div>

            </div>
        </div>
    );
};

export default SystemRoom;
