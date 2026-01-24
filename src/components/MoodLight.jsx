import React, { useEffect, useState, useRef } from 'react';
import '../styles/mood-light.css';

const MoodLight = ({ color }) => {
    const [particles, setParticles] = useState([]);
    const containerRef = useRef(null);

    // Generate particles when color changes
    useEffect(() => {
        const generateParticles = () => {
            const newParticles = [];
            const count = 15; // Number of floating particles

            for (let i = 0; i < count; i++) {
                newParticles.push({
                    id: i,
                    left: Math.random() * 100,
                    delay: Math.random() * 5,
                    duration: 8 + Math.random() * 7,
                    size: 4 + Math.random() * 12,
                    opacity: 0.1 + Math.random() * 0.4,
                });
            }
            setParticles(newParticles);
        };

        generateParticles();
    }, [color]);

    // Get glow color - slightly brighter version
    const getGlowColor = (hex) => {
        // Convert hex to RGB and make it glow
        return hex;
    };

    return (
        <div className="mood-light-container" ref={containerRef}>
            {/* Ambient glow at edges */}
            <div
                className="mood-glow mood-glow-left"
                style={{
                    background: `radial-gradient(ellipse at left, ${color}40 0%, transparent 60%)`
                }}
            />
            <div
                className="mood-glow mood-glow-right"
                style={{
                    background: `radial-gradient(ellipse at right, ${color}40 0%, transparent 60%)`
                }}
            />
            <div
                className="mood-glow mood-glow-bottom"
                style={{
                    background: `radial-gradient(ellipse at bottom, ${color}30 0%, transparent 50%)`
                }}
            />

            {/* Floating particles */}
            {particles.map(p => (
                <div
                    key={p.id}
                    className="mood-particle"
                    style={{
                        left: `${p.left}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: color,
                        boxShadow: `0 0 ${p.size * 2}px ${color}, 0 0 ${p.size * 4}px ${color}80`,
                        opacity: p.opacity,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                    }}
                />
            ))}

            {/* Central subtle pulse */}
            <div
                className="mood-pulse"
                style={{
                    background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
                }}
            />
        </div>
    );
};

export default MoodLight;
