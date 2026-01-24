import React, { useState, useEffect } from 'react';
import '../styles/contract-room.css';
import audioEngine from '../utils/AudioEngine';

const ContractRoom = () => {
    const [task, setTask] = useState('');
    const [deadline, setDeadline] = useState(''); // Simple string for now, e.g. "Tonight"
    const [contracts, setContracts] = useState([]);
    const [soulPoints, setSoulPoints] = useState(0);

    useEffect(() => {
        const savedContracts = localStorage.getItem('shadow_contracts');
        if (savedContracts) setContracts(JSON.parse(savedContracts));

        const savedPoints = localStorage.getItem('soul_points');
        if (savedPoints) setSoulPoints(parseInt(savedPoints, 10));
    }, []);

    const saveContracts = (newContracts) => {
        setContracts(newContracts);
        localStorage.setItem('shadow_contracts', JSON.stringify(newContracts));
    };

    const signContract = () => {
        if (!task.trim()) return;

        const newContract = {
            id: Date.now(),
            task: task,
            deadline: deadline || "Eventually",
            status: 'active', // active, fulfilled, breached
            timestamp: new Date().toLocaleDateString()
        };

        const updated = [newContract, ...contracts];
        saveContracts(updated);
        setTask('');
        setDeadline('');

        // Sound effect
        audioEngine.play('static');
        setTimeout(() => audioEngine.stop(), 300);
    };

    const fulfillContract = (id) => {
        const updated = contracts.map(c =>
            c.id === id ? { ...c, status: 'fulfilled' } : c
        );
        saveContracts(updated);

        // Reward
        const newPoints = soulPoints + 100;
        setSoulPoints(newPoints);
        localStorage.setItem('soul_points', newPoints.toString());
    };

    const burnContract = (id) => {
        const updated = contracts.filter(c => c.id !== id);
        saveContracts(updated);
    };

    return (
        <div className="contract-room">
            <header className="contract-header">
                <h2>Shadow Contracts</h2>
                <div className="soul-counter">
                    <span>Soul Harvest: </span>
                    <span className="soul-value">{soulPoints}</span>
                </div>
            </header>

            <div className="parchment-container">
                <div className="contract-form">
                    <h3>Pledge Your Soul</h3>
                    <div className="input-group">
                        <label>I hereby pledge to...</label>
                        <input
                            type="text"
                            className="contract-input"
                            placeholder="Finish the draft, Fix the bug..."
                            value={task}
                            onChange={(e) => setTask(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label>By the time of...</label>
                        <input
                            type="text"
                            className="contract-input"
                            placeholder="Midnight, Tomorrow..."
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                        />
                    </div>
                    <button className="sign-btn" onClick={signContract}>
                        ✒️ SIGN IN BLOOD
                    </button>
                </div>

                <div className="contracts-list">
                    <h3>Active Pacts</h3>
                    {contracts.length === 0 && <p className="empty-msg">No active deals. Your soul is... safe.</p>}

                    {contracts.map(contract => (
                        <div key={contract.id} className={`contract-item ${contract.status}`}>
                            <div className="contract-details">
                                <span className="contract-task">"{contract.task}"</span>
                                <span className="contract-meta">Due: {contract.deadline} • {contract.timestamp}</span>
                            </div>
                            {contract.status === 'active' && (
                                <div className="contract-actions">
                                    <button className="fulfill-btn" onClick={() => fulfillContract(contract.id)}>FULFILL</button>
                                    <button className="breach-btn" onClick={() => burnContract(contract.id)}>BURN</button>
                                </div>
                            )}
                            {contract.status === 'fulfilled' && (
                                <div className="seal-stamp">FULFILLED</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ContractRoom;
