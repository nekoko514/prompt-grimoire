import React, { useState, useRef } from 'react';
import '../styles/dark-room.css';

const DarkRoom = () => {
    const [originalImage, setOriginalImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [tolerance, setTolerance] = useState(30);
    const [targetColor, setTargetColor] = useState({ r: 255, g: 255, b: 255 });
    const [isProcessing, setIsProcessing] = useState(false);
    const [mode, setMode] = useState('contiguous'); // 'global' or 'contiguous'

    const canvasRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                setOriginalImage(img);
                setProcessedImage(null); // Reset prev processing
                // For initial load, just draw the image without processing
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const processGlobal = (img, target, tol) => {
        setIsProcessing(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const { r: tr, g: tg, b: tb } = target;
        const threshold = tol * 2.55;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const dist = Math.sqrt((r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2);

            if (dist <= threshold) {
                data[i + 3] = 0;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        setProcessedImage(canvas.toDataURL('image/png'));
        setIsProcessing(false);
    };

    const processFloodFill = (img, startX, startY, tol) => {
        setIsProcessing(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Reset canvas to original to ensure we work on fresh data
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Get target color from start position
        const startPos = (Math.floor(startY) * width + Math.floor(startX)) * 4;
        const targetR = data[startPos];
        const targetG = data[startPos + 1];
        const targetB = data[startPos + 2];
        const targetA = data[startPos + 3];

        // Queue for BFS
        const queue = [[Math.floor(startX), Math.floor(startY)]];
        const visited = new Uint8Array(width * height); // keep track of visited pixels
        const threshold = tol * 2.55;

        // Helper to check color match
        const matches = (idx) => {
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const dist = Math.sqrt((r - targetR) ** 2 + (g - targetG) ** 2 + (b - targetB) ** 2);
            return dist <= threshold;
        };

        while (queue.length > 0) {
            const [cx, cy] = queue.shift();
            const idx = (cy * width + cx) * 4;
            const visitedIdx = cy * width + cx;

            if (visited[visitedIdx]) continue;
            // Check if this pixel matches target
            if (!matches(idx)) continue;

            // "Color" it transparent
            data[idx + 3] = 0;
            visited[visitedIdx] = 1;

            // Add neighbors
            if (cx > 0) queue.push([cx - 1, cy]);
            if (cx < width - 1) queue.push([cx + 1, cy]);
            if (cy > 0) queue.push([cx, cy - 1]);
            if (cy < height - 1) queue.push([cx, cy + 1]);
        }

        ctx.putImageData(imageData, 0, 0);
        setProcessedImage(canvas.toDataURL('image/png'));
        setIsProcessing(false);
    };

    const handleCanvasClick = (e) => {
        if (!originalImage) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const ctx = canvas.getContext('2d');
        // Redraw original temporarily to pick accurate color if in Global Mode
        // For Flood Fill, we need to pass coordinates

        if (mode === 'global') {
            // For picking color in global mode
            ctx.drawImage(originalImage, 0, 0);
            const p = ctx.getImageData(x, y, 1, 1).data;
            const pickedColor = { r: p[0], g: p[1], b: p[2] };
            setTargetColor(pickedColor);
            processGlobal(originalImage, pickedColor, tolerance);
        } else {
            // Contiguous / Flood Fill Mode
            processFloodFill(originalImage, x, y, tolerance);
        }
    };

    const handleToleranceChange = (e) => {
        const val = parseInt(e.target.value);
        setTolerance(val);
        // We can't auto-update flood fill easily without knowing start point again
        // For Global we can
        if (mode === 'global' && originalImage) {
            processGlobal(originalImage, targetColor, val);
        }
    };

    const [format, setFormat] = useState('image/png');

    const downloadImage = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const link = document.createElement('a');
        const ext = format.split('/')[1];
        link.download = `transmuted_sprite.${ext}`;
        link.href = canvas.toDataURL(format);
        link.click();
    };

    return (
        <div className="dark-room">
            <header className="dark-room-header">
                <h2>🧪 The Darkroom (Alchemy Lab)</h2>
                <input
                    type="file"
                    id="darkroom-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    hidden
                />
                <label htmlFor="darkroom-upload" className="upload-btn">
                    📥 Upload Image (Test Subject)
                </label>
            </header>

            <div className="dark-room-controls">
                <div className="control-group">
                    <label>Extraction Mode:</label>
                    <div className="mode-toggle">
                        <button
                            className={`mode-btn ${mode === 'global' ? 'active' : ''}`}
                            onClick={() => setMode('global')}
                        >
                            🌍 Global
                        </button>
                        <button
                            className={`mode-btn ${mode === 'contiguous' ? 'active' : ''}`}
                            onClick={() => setMode('contiguous')}
                        >
                            🪄 Contiguous (Safe)
                        </button>
                    </div>
                </div>

                <div className="control-group">
                    <label>Extraction Sensitivity: {tolerance}</label>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={tolerance}
                        onChange={handleToleranceChange}
                    />
                </div>

                {mode === 'global' && (
                    <div className="control-group">
                        <div className="color-preview">
                            Target Color:
                            <span
                                className="color-swatch"
                                style={{ backgroundColor: `rgb(${targetColor.r}, ${targetColor.g}, ${targetColor.b})` }}
                            />
                        </div>
                    </div>
                )}

                <div className="control-group action-group">
                    <select
                        className="format-select"
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                    >
                        <option value="image/png">PNG (Best for Transp.)</option>
                        <option value="image/webp">WebP (Lightweight)</option>
                        <option value="image/jpeg">JPG (No Transp.)</option>
                    </select>

                    <button
                        className="download-btn"
                        onClick={downloadImage}
                        disabled={!originalImage}
                    >
                        💾 Save Result
                    </button>
                    {format === 'image/jpeg' && <span className="warning-text">⚠️ JPG turns transparent to black</span>}
                </div>
            </div>

            <div className="canvas-container">
                {!originalImage && (
                    <div className="empty-placeholder">
                        <p>No subject on the table...</p>
                        <p>Upload an image to strip its soul (background).</p>
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className={originalImage ? 'active-canvas' : 'hidden-canvas'}
                />
                <p className="instruction-text">
                    {mode === 'contiguous'
                        ? '👆 Click on the background you want to remove'
                        : '👆 Click on a color to remove it from everywhere'}
                </p>
            </div>
        </div>
    );
};

export default DarkRoom;
