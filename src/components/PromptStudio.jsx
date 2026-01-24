import React, { useState } from 'react';
import promptData from '../data/prompts.json';

const PromptStudio = ({
    timeOfDay,
    setTimeOfDay,
    selectedPrompts,
    setSelectedPrompts,
    activeColor,
    setActiveColor
}) => {
    // const [selectedPrompts, setSelectedPrompts] = useState([]); <--- Removed (Lifted)
    // const [activeColor, setActiveColor] = useState(...); <--- Removed (Lifted)
    const [copied, setCopied] = useState(false);

    // Add or Remove prompt from the builder
    const togglePrompt = (value) => {
        setSelectedPrompts(prev => {
            if (prev.includes(value)) {
                return prev.filter(p => p !== value);
            } else {
                return [...prev, value];
            }
        });
    };



    const fullPrompt = selectedPrompts
        .map(p => p.replace('{color}', activeColor.label.toLowerCase()))
        .join(' ');

    const handleCopy = () => {
        if (!fullPrompt) return;
        navigator.clipboard.writeText(fullPrompt).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleClear = () => {
        setSelectedPrompts([]);
    };

    // Chaos Summon Logic
    const handleChaos = () => {
        const categories = ['character', 'outfits', 'scenario', 'situation'];
        const randomPicks = [];

        categories.forEach(catId => {
            const category = promptData.categories.find(c => c.id === catId);
            if (category && category.items.length > 0) {
                const randomItem = category.items[Math.floor(Math.random() * category.items.length)];
                randomPicks.push(randomItem.value);
            }
        });

        setSelectedPrompts(randomPicks);
    };

    return (
        <>
            <header>
                <h1>Prompt Grimoire</h1>
                <div className="subtitle">Alastor's Art Atelier</div>

                <div className="time-controls">
                    {['all', 'morning', 'day', 'night'].map(time => (
                        <button
                            key={time}
                            className={`time-btn ${timeOfDay === time ? 'active' : ''}`}
                            onClick={() => setTimeOfDay(time)}
                        >
                            {time.toUpperCase()}
                        </button>
                    ))}
                </div>
            </header>

            <div className="color-palette-container">
                <div className="palette-label">Wardrobe Color: <span style={{ color: activeColor.hex }}>{activeColor.label}</span></div>
                <div className="color-options">
                    {promptData.categories.find(c => c.id === 'colors').items.map((color) => (
                        <button
                            key={color.id}
                            className={`color-btn ${activeColor.id === color.id ? 'active' : ''}`}
                            style={{ backgroundColor: color.hex }}
                            onClick={() => setActiveColor(color)}
                            title={color.label}
                        />
                    ))}
                </div>
            </div>

            <main>
                {promptData.categories
                    .filter(cat => cat.id !== 'colors')
                    .map((category) => (
                        <section key={category.id} className="category-section">
                            <h2 className="category-title">{category.name}</h2>
                            <div className="prompt-grid">
                                {category.items
                                    .filter(item => !item.time || timeOfDay === 'all' || item.time.includes(timeOfDay))
                                    .map((item) => {
                                        const isSelected = selectedPrompts.includes(item.value);
                                        return (
                                            <div
                                                key={item.id}
                                                className={`prompt-card ${isSelected ? 'selected' : ''}`}
                                                onClick={() => togglePrompt(item.value)}
                                            >
                                                <span className="card-label">{item.label}</span>
                                                <span className="card-desc">{item.description}</span>
                                            </div>
                                        );
                                    })}
                            </div>
                        </section>
                    ))}
            </main>

            <div className="builder-bar">
                <div className="builder-display">
                    {fullPrompt || "Select spells to conjure specifics..."}
                </div>
                <div className="builder-controls">
                    <button className="btn btn-chaos" onClick={handleChaos}>
                        INVOKE CHAOS
                    </button>
                    <button className="btn btn-clear" onClick={handleClear}>
                        Clear
                    </button>
                    <button className="btn btn-copy" onClick={handleCopy}>
                        {copied ? 'COPIED!' : 'COPY SPELL'}
                    </button>
                </div>
            </div>

            {copied && <div className="toast">Spell Copied to Clipboard!</div>}
        </>
    );
};

export default PromptStudio;
