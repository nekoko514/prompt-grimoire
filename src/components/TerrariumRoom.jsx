import React, { useState, useEffect, useRef } from 'react';
import '../styles/terrarium-room.css';

// Import room backgrounds
import radioStudio from '../assets/terrarium/radio_studio.png';
import bedroom from '../assets/terrarium/bedroom.png';
import kitchen from '../assets/terrarium/kitchen.png';
import garden from '../assets/terrarium/garden.png';
import alastorSprite from '../assets/terrarium/alastor.png';

const ROOMS = [
    { id: 'garden', name: '薔薇園', nameEn: 'Rose Garden', image: garden },
    { id: 'kitchen', name: '調理場', nameEn: 'Kitchen', image: kitchen },
    { id: 'radio', name: '放送室', nameEn: 'Radio Studio', image: radioStudio },
    { id: 'bedroom', name: '寝室', nameEn: 'Bedroom', image: bedroom },
];

const TerrariumRoom = () => {
    const [currentRoomIndex, setCurrentRoomIndex] = useState(2); // Start at radio studio
    const [characterX, setCharacterX] = useState(50); // percentage
    const [isWalking, setIsWalking] = useState(false);
    const [facingLeft, setFacingLeft] = useState(false);
    const containerRef = useRef(null);

    const currentRoom = ROOMS[currentRoomIndex];

    // Handle click to move character
    const handleBackgroundClick = (e) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newX = (clickX / rect.width) * 100;

        // Clamp between 10% and 90%
        const clampedX = Math.max(10, Math.min(90, newX));

        // Determine direction
        setFacingLeft(clampedX < characterX);
        setIsWalking(true);
        setCharacterX(clampedX);

        // Stop walking animation after movement
        setTimeout(() => setIsWalking(false), 800);
    };

    const goToRoom = (direction) => {
        setIsWalking(true);
        setFacingLeft(direction === 'left');

        setTimeout(() => {
            if (direction === 'left' && currentRoomIndex > 0) {
                setCurrentRoomIndex(currentRoomIndex - 1);
                setCharacterX(80); // Enter from right
            } else if (direction === 'right' && currentRoomIndex < ROOMS.length - 1) {
                setCurrentRoomIndex(currentRoomIndex + 1);
                setCharacterX(20); // Enter from left
            }
            setIsWalking(false);
        }, 500);
    };

    return (
        <div className="terrarium-room">
            <header className="terrarium-header">
                <h2>🏠 Alastor's Estate</h2>
                <div className="room-indicator">
                    {ROOMS.map((room, index) => (
                        <span
                            key={room.id}
                            className={`room-dot ${index === currentRoomIndex ? 'active' : ''}`}
                            title={room.name}
                        />
                    ))}
                </div>
            </header>

            <div className="terrarium-stage" ref={containerRef} onClick={handleBackgroundClick}>
                {/* Room Background */}
                <img
                    src={currentRoom.image}
                    alt={currentRoom.name}
                    className="room-background"
                />

                {/* Character - temporarily hidden until sprite is fixed
                <div
                    className={`character ${isWalking ? 'walking' : ''} ${facingLeft ? 'facing-left' : ''}`}
                    style={{ left: `${characterX}%` }}
                >
                    <img src={alastorSprite} alt="Alastor" />
                </div>
                */}

                {/* Room Navigation Arrows */}
                {currentRoomIndex > 0 && (
                    <button
                        className="nav-arrow left"
                        onClick={(e) => { e.stopPropagation(); goToRoom('left'); }}
                    >
                        ◀ {ROOMS[currentRoomIndex - 1].name}
                    </button>
                )}
                {currentRoomIndex < ROOMS.length - 1 && (
                    <button
                        className="nav-arrow right"
                        onClick={(e) => { e.stopPropagation(); goToRoom('right'); }}
                    >
                        {ROOMS[currentRoomIndex + 1].name} ▶
                    </button>
                )}
            </div>

            <div className="room-name-display">
                <span className="room-name-jp">{currentRoom.name}</span>
                <span className="room-name-en">{currentRoom.nameEn}</span>
            </div>

            <div className="terrarium-hint">
                矢印ボタンで部屋を探索できます
            </div>
        </div>
    );
};

export default TerrariumRoom;
