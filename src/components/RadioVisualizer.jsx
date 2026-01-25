import React, { useEffect, useRef } from 'react';
import audioEngine from '../utils/AudioEngine';
import '../styles/radio-visualizer.css';

const RadioVisualizer = ({ isPlaying }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        const draw = () => {
            // Get frequency data
            const dataArray = audioEngine.getFrequencyData();
            const barCount = 16; // Number of bars to display
            const barWidth = (width / barCount) - 4;
            const barGap = 4;

            // Clear canvas with dark background
            ctx.fillStyle = '#0a0505';
            ctx.fillRect(0, 0, width, height);

            // Draw vintage radio grid lines
            ctx.strokeStyle = 'rgba(139, 69, 69, 0.3)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                const y = (height / 5) * i;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            // Draw frequency bars
            for (let i = 0; i < barCount; i++) {
                // Map frequency data to bar height
                const dataIndex = Math.floor((i / barCount) * dataArray.length);
                const value = dataArray[dataIndex] || 0;
                const barHeight = (value / 255) * (height - 20);

                const x = i * (barWidth + barGap) + barGap / 2;
                const y = height - barHeight - 10;

                // Gradient from dark red to bright red
                const gradient = ctx.createLinearGradient(x, y + barHeight, x, y);
                gradient.addColorStop(0, '#4a0000');
                gradient.addColorStop(0.5, '#8a0303');
                gradient.addColorStop(1, '#ff2222');

                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, barWidth, barHeight);

                // Add glow effect for high values
                if (value > 150) {
                    ctx.shadowColor = '#ff0000';
                    ctx.shadowBlur = 10;
                    ctx.fillRect(x, y, barWidth, barHeight);
                    ctx.shadowBlur = 0;
                }
            }

            // Continue animation
            if (isPlaying) {
                animationRef.current = requestAnimationFrame(draw);
            }
        };

        if (isPlaying) {
            draw();
        } else {
            // Draw static bars when not playing
            ctx.fillStyle = '#0a0505';
            ctx.fillRect(0, 0, width, height);

            // Draw dim static bars
            const barCount = 16;
            const barWidth = (width / barCount) - 4;
            for (let i = 0; i < barCount; i++) {
                const x = i * (barWidth + 4) + 2;
                const barHeight = 10 + Math.random() * 20;
                ctx.fillStyle = '#2a0505';
                ctx.fillRect(x, height - barHeight - 10, barWidth, barHeight);
            }
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isPlaying]);

    return (
        <div className="radio-visualizer">
            <div className="visualizer-frame">
                <div className="frame-corner top-left"></div>
                <div className="frame-corner top-right"></div>
                <div className="frame-corner bottom-left"></div>
                <div className="frame-corner bottom-right"></div>

                <div className="visualizer-header">
                    <span className="radio-icon">📻</span>
                    <span className="broadcast-text">ALASTOR'S BROADCAST</span>
                    <span className="radio-icon">📻</span>
                </div>

                <canvas
                    ref={canvasRef}
                    width={280}
                    height={80}
                    className="visualizer-canvas"
                />

                <div className="visualizer-footer">
                    <span className="freq-display">66.6 FM</span>
                    <div className={`on-air-light ${isPlaying ? 'active' : ''}`}>
                        ON AIR
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RadioVisualizer;
