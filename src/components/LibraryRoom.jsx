import React, { useState, useEffect } from 'react';
import '../styles/library-room.css';

const LibraryRoom = ({ selectedPrompts, setSelectedPrompts, activeColor, setActiveColor, promptData }) => {
    const [savedGrimoires, setSavedGrimoires] = useState([]);
    const [newGrimoireName, setNewGrimoireName] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('grimoires');
        if (saved) {
            setSavedGrimoires(JSON.parse(saved));
        }
    }, []);

    const saveGrimoire = () => {
        if (!newGrimoireName.trim()) return;
        if (selectedPrompts.length === 0) {
            alert("The grimoire is empty. Compose a spell first.");
            return;
        }

        const newGrimoire = {
            id: Date.now(),
            name: newGrimoireName,
            prompts: selectedPrompts,
            colorId: activeColor.id,
            date: new Date().toLocaleDateString()
        };

        const updatedList = [newGrimoire, ...savedGrimoires];
        setSavedGrimoires(updatedList);
        localStorage.setItem('grimoires', JSON.stringify(updatedList));
        setNewGrimoireName('');
    };

    const loadGrimoire = (grimoire) => {
        setSelectedPrompts(grimoire.prompts);

        // Find the full color object from promptData
        const colorObj = promptData.categories
            .find(c => c.id === 'colors').items
            .find(i => i.id === grimoire.colorId);

        if (colorObj) {
            setActiveColor(colorObj);
        }

        // Notify user (could be better UI, but simple alert for now or just switch room in App)
        // Since we are in Library, we probably want to stay here or switch? 
        // Plan says "Load" sets state. User likely wants to go to Studio after loading.
        // We'll leave the room switching to the user via Nav for now, or add a "Load & Open" button.
    };

    const deleteGrimoire = (id) => {
        const updatedList = savedGrimoires.filter(g => g.id !== id);
        setSavedGrimoires(updatedList);
        localStorage.setItem('grimoires', JSON.stringify(updatedList));
    };

    return (
        <div className="library-room">
            <header className="library-header">
                <h2>The Forbidden Library</h2>
                <p>Archive your most potent spell combinations.</p>
            </header>

            <div className="save-section">
                <div className="current-state-preview">
                    <span>Current Spell: {selectedPrompts.length} runes</span>
                    <span style={{ color: activeColor.hex }}>Theme: {activeColor.label}</span>
                </div>
                <div className="save-controls">
                    <input
                        type="text"
                        placeholder="Name this Grimoire..."
                        value={newGrimoireName}
                        onChange={(e) => setNewGrimoireName(e.target.value)}
                        className="grimoire-input"
                    />
                    <button className="library-btn save-btn" onClick={saveGrimoire}>Archive Spell</button>
                </div>
            </div>

            <div className="bookshelf">
                {savedGrimoires.length === 0 && (
                    <div className="empty-shelf">The shelves are gathering dust...</div>
                )}
                {savedGrimoires.map(g => (
                    <div key={g.id} className="grimoire-book">
                        <div className="book-spine" style={{ borderLeftColor: promptData.categories.find(c => c.id === 'colors').items.find(i => i.id === g.colorId)?.hex || '#555' }}></div>
                        <div className="book-info">
                            <h3>{g.name}</h3>
                            <div className="book-meta">{g.date} • {g.prompts.length} Runes</div>
                        </div>
                        <div className="book-actions">
                            <button className="library-btn load-btn" onClick={() => loadGrimoire(g)}>Load</button>
                            <button className="library-btn delete-btn" onClick={() => deleteGrimoire(g.id)}>Burn</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LibraryRoom;
