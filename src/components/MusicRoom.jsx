import React, { useState, useEffect } from 'react';
import audioEngine from '../utils/AudioEngine';
import { getAllCustomTracks, saveCustomTrack, deleteCustomTrack, fileToBase64 } from '../utils/audioStorage';
import '../styles/music-room.css';

const MusicRoom = () => {
    const [showImport, setShowImport] = useState(false);
    const [importData, setImportData] = useState({ audio: null, image: null, title: 'Untitled Vinyl' });
    const [customTracks, setCustomTracks] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [volume, setVolume] = useState(0.5);
    const [isLoading, setIsLoading] = useState(false);

    // Load saved custom tracks on mount
    useEffect(() => {
        const loadTracks = async () => {
            try {
                const savedTracks = await getAllCustomTracks();
                setCustomTracks(savedTracks);
            } catch (e) {
                console.error("Failed to load custom tracks:", e);
            }
        };
        loadTracks();

        // Sync with audio engine state
        try {
            if (audioEngine && audioEngine.isPlaying) {
                setIsPlaying(true);
                setCurrentTrack(audioEngine.currentTrack);
                setSelectedTrack(audioEngine.currentTrack);
            }
        } catch (e) {
            console.error("Audio Engine Sync Error:", e);
        }
    }, []);

    const baseTracks = [
        { id: 'static', label: 'Radio Frequency', freq: '66.6 FM', icon: '📻' },
        { id: 'rain', label: 'Midnight Rain', freq: 'AM 1930', icon: '🌧️' },
        { id: 'jazz', label: 'The Jazz Estate', freq: 'JAZZ-24', icon: '🎷' },
        { id: 'humming', label: 'Alastor\'s Humming', freq: 'VOX-99', icon: '🎙️' },
        { id: 'screams', label: 'Distant Screams', freq: 'HELL-01', icon: '👻' },
        { id: 'void', label: 'The Void', freq: 'ERROR', icon: '🕳️' },
        { id: 'underwater', label: 'Deep Abyss', freq: '∿∿∿', icon: '🌊' }
    ];

    const tracks = [...customTracks, ...baseTracks];
    const currentTrackInfo = tracks.find(t => t.id === currentTrack);
    const selectedTrackInfo = tracks.find(t => t.id === selectedTrack);

    // Select a track
    const handleSelectTrack = (trackId) => {
        setSelectedTrack(trackId);
        if (isPlaying && currentTrack !== trackId) {
            playTrack(trackId);
        }
    };

    // Play track - for custom tracks, use the base64 audio
    const playTrack = async (trackId) => {
        const track = trackId || selectedTrack;
        if (!track) return;

        try {
            if (audioEngine) {
                // Find track info to get audio source
                const trackInfo = tracks.find(t => t.id === track);
                const audioSource = trackInfo?.audioBase64 || track;

                await audioEngine.play(audioSource);
                setIsPlaying(true);
                setCurrentTrack(track);
                setSelectedTrack(track);
            }
        } catch (e) {
            console.error("Playback failed:", e);
        }
    };

    // Stop playback
    const handleStop = () => {
        try {
            if (audioEngine) {
                audioEngine.stop();
                setIsPlaying(false);
                setCurrentTrack(null);
            }
        } catch (e) {
            console.error("Stop failed:", e);
        }
    };

    // Toggle play/pause
    const handlePlayPause = async () => {
        if (isPlaying) {
            handleStop();
        } else {
            await playTrack(selectedTrack);
        }
    };

    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (audioEngine) audioEngine.setVolume(val);
    };

    // Import Handlers
    const handleAudioUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImportData({ ...importData, audio: e.target.files[0] });
        }
    };

    const handleImageUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImportData({ ...importData, image: e.target.files[0] });
        }
    };

    // Create vinyl with persistence
    const handleCreateVinyl = async () => {
        if (!importData.audio) return alert("Audio file is required!");

        setIsLoading(true);
        try {
            // Convert files to Base64 for persistence
            const audioBase64 = await fileToBase64(importData.audio);
            const imageBase64 = importData.image ? await fileToBase64(importData.image) : null;

            const trackId = `custom_${Date.now()}`;
            const newTrack = {
                id: trackId,
                label: importData.title || "Unknown Record",
                freq: "USER LW",
                icon: "💿",
                audioBase64: audioBase64,
                imageBase64: imageBase64,
                image: imageBase64, // For display compatibility
                isCustom: true
            };

            // Save to IndexedDB
            await saveCustomTrack(newTrack);

            // Update state
            setCustomTracks(prev => [...prev, newTrack]);
            setImportData({ audio: null, image: null, title: 'Untitled Vinyl' });
            setShowImport(false);
        } catch (e) {
            console.error("Vinyl creation failed:", e);
            alert("Failed to save vinyl. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Delete a custom track
    const handleDeleteTrack = async (trackId, e) => {
        e.stopPropagation(); // Prevent selecting the track
        try {
            await deleteCustomTrack(trackId);
            setCustomTracks(prev => prev.filter(t => t.id !== trackId));

            // If currently playing this track, stop
            if (currentTrack === trackId) {
                handleStop();
            }
            if (selectedTrack === trackId) {
                setSelectedTrack(null);
            }
        } catch (e) {
            console.error("Delete failed:", e);
        }
    };

    const recordStyle = (currentTrackInfo && currentTrackInfo.image)
        ? { backgroundImage: `url(${currentTrackInfo.image})`, backgroundSize: 'cover' }
        : {};

    return (
        <div className="music-room">
            <header className="music-header">
                <h2>The Phonograph</h2>
                <div className="room-controls">
                    <button className="import-toggle-btn" onClick={() => setShowImport(!showImport)}>
                        {showImport ? 'Close Maker' : '+ Import Vinyl'}
                    </button>
                </div>
            </header>

            {showImport && (
                <div className="import-panel">
                    <h3>Cut a New Vinyl</h3>
                    <div className="import-row">
                        <label>Title:</label>
                        <input
                            type="text"
                            value={importData.title}
                            onChange={(e) => setImportData({ ...importData, title: e.target.value })}
                            placeholder="Song Title..."
                        />
                    </div>
                    <div className="import-row">
                        <label>Audio (MP3/WAV):</label>
                        <input type="file" accept="audio/*" onChange={handleAudioUpload} />
                    </div>
                    <div className="import-row">
                        <label>Cover Art:</label>
                        <input type="file" accept="image/*" onChange={handleImageUpload} />
                    </div>
                    <button
                        className="create-vinyl-btn"
                        onClick={handleCreateVinyl}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Pressing...' : 'Press Vinyl Record'}
                    </button>
                </div>
            )}

            <div className="gramophone-container">
                <div className={`vinyl-record ${isPlaying ? 'spinning' : ''}`}>
                    <div className="vinyl-label" style={recordStyle}>
                        {!currentTrackInfo?.image && <span className="vinyl-text">ALASTOR</span>}
                    </div>
                </div>
                <div className="needle-arm"></div>

                {isPlaying && (
                    <div className="visualizer-particles">
                        <div className="note n1">♪</div>
                        <div className="note n2">♫</div>
                        <div className="note n3">♩</div>
                    </div>
                )}
            </div>

            <div className="now-playing">
                {isPlaying && currentTrackInfo ? (
                    <span className="track-name">Now Playing: {currentTrackInfo.label}</span>
                ) : selectedTrackInfo ? (
                    <span className="track-name">Selected: {selectedTrackInfo.label}</span>
                ) : (
                    <span className="track-name">Select a broadcast...</span>
                )}
            </div>

            <div className="playback-controls">
                <button
                    className={`control-btn play-btn ${!selectedTrack ? 'disabled' : ''}`}
                    onClick={handlePlayPause}
                    disabled={!selectedTrack}
                >
                    {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
                <button
                    className={`control-btn stop-btn ${!isPlaying ? 'disabled' : ''}`}
                    onClick={handleStop}
                    disabled={!isPlaying}
                >
                    ⏹ Stop
                </button>
            </div>

            <div className="volume-control">
                <label>Volume</label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                />
            </div>

            <div className="record-shelf">
                {tracks.map(track => (
                    <div
                        key={track.id}
                        className={`record-jacket ${selectedTrack === track.id ? 'selected' : ''} ${currentTrack === track.id && isPlaying ? 'active' : ''}`}
                        onClick={() => handleSelectTrack(track.id)}
                    >
                        <div className="jacket-sleeve" style={track.image ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${track.image})`, backgroundSize: 'cover' } : {}}>
                            <span className="jacket-icon">{track.icon}</span>
                            <span className="jacket-title">{track.label}</span>
                            <span className="jacket-freq">{track.freq}</span>
                            {track.isCustom && (
                                <button
                                    className="delete-track-btn"
                                    onClick={(e) => handleDeleteTrack(track.id, e)}
                                    title="Delete"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MusicRoom;
