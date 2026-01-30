import React from 'react';
import '../styles/navigation.css';

const Navigation = ({ currentRoom, setRoom }) => {
    const rooms = [
        { id: 'transmitter', label: 'Transmitter', icon: '📻' },
        { id: 'studio', label: 'Broadcasting', icon: '🎙️' },
        { id: 'vault', label: 'The Vault', icon: '💾' },
        { id: 'archive', label: 'Archive', icon: '📚' },
        { id: 'guest', label: 'Guest Room', icon: '📝' },
        { id: 'calendar', label: 'Schedule', icon: '📅' },
        { id: 'diary', label: 'Dream Journal', icon: '🌙' },
        { id: 'gallery', label: 'The Gallery', icon: '🖼️' },
        { id: 'contracts', label: 'Contracts', icon: '📜' },
        { id: 'personas', label: 'Persona Vault', icon: '🎭' },
        { id: 'music', label: 'Phonograph', icon: '🎵' },
        { id: 'game', label: 'Game Room', icon: '🎲' },
        { id: 'terrarium', label: 'The Estate', icon: '🏠' },
        { id: 'darkroom', label: 'Darkroom', icon: '🧪' },
        { id: 'system', label: 'System', icon: '⚙️' }
    ];

    return (
        <nav className="mansion-nav">
            {rooms.map(room => (
                <button
                    key={room.id}
                    className={`nav-btn ${currentRoom === room.id ? 'active' : ''}`}
                    onClick={() => setRoom(room.id)}
                >
                    <span className="nav-icon">{room.icon}</span>
                    <span className="nav-label">{room.label}</span>
                </button>
            ))}
        </nav>
    );
};

export default Navigation;
