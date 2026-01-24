import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/gallery-room.css';
import imageDB from '../utils/ImageDB';

const GalleryRoom = () => {
    const [images, setImages] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(null); // Index instead of image object
    const [touchStart, setTouchStart] = useState(null);
    const modalRef = useRef(null);

    const selectedImage = selectedIndex !== null ? images[selectedIndex] : null;

    useEffect(() => {
        loadImages();
    }, []);

    // Keyboard navigation
    useEffect(() => {
        if (selectedIndex === null) return;

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                navigatePrev();
            } else if (e.key === 'ArrowRight') {
                navigateNext();
            } else if (e.key === 'Escape') {
                setSelectedIndex(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex, images.length]);

    const loadImages = async () => {
        const imgs = await imageDB.getAllImages();
        setImages(imgs.reverse()); // Newest first
    };

    const handleUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            await imageDB.addImage(files[i]);
        }
        await loadImages();
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm("Burn this masterpiece?")) {
            await imageDB.deleteImage(id);
            await loadImages();
            if (selectedImage && selectedImage.id === id) setSelectedIndex(null);
        }
    };

    const navigatePrev = useCallback(() => {
        if (selectedIndex > 0) {
            setSelectedIndex(selectedIndex - 1);
        } else {
            setSelectedIndex(images.length - 1); // Loop to end
        }
    }, [selectedIndex, images.length]);

    const navigateNext = useCallback(() => {
        if (selectedIndex < images.length - 1) {
            setSelectedIndex(selectedIndex + 1);
        } else {
            setSelectedIndex(0); // Loop to beginning
        }
    }, [selectedIndex, images.length]);

    // Touch handlers for swipe
    const handleTouchStart = (e) => {
        setTouchStart(e.touches[0].clientX);
    };

    const handleTouchEnd = (e) => {
        if (touchStart === null) return;
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStart - touchEnd;

        if (Math.abs(diff) > 50) { // Minimum swipe distance
            if (diff > 0) {
                navigateNext(); // Swipe left = next
            } else {
                navigatePrev(); // Swipe right = prev
            }
        }
        setTouchStart(null);
    };

    const openImage = (index) => {
        setSelectedIndex(index);
    };

    return (
        <div className="gallery-room">
            <header className="gallery-header">
                <h2>Alastor's Private Gallery</h2>
                <div className="upload-section">
                    <label htmlFor="file-upload" className="upload-btn">
                        🖼️ Hang New Artwork
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleUpload}
                        style={{ display: 'none' }}
                    />
                </div>
            </header>

            <div className="gallery-grid">
                {images.length === 0 && (
                    <div className="empty-gallery">
                        <p>The walls are bare... create something.</p>
                    </div>
                )}

                {images.map((img, index) => (
                    <div
                        key={img.id}
                        className="gallery-frame"
                        onClick={() => openImage(index)}
                    >
                        <img src={URL.createObjectURL(img.blob)} alt={img.name} className="gallery-thumb" />
                        <button className="burn-btn" onClick={(e) => handleDelete(img.id, e)}>×</button>
                    </div>
                ))}
            </div>

            {/* Modal with Slider */}
            {selectedImage && (
                <div
                    className="gallery-modal"
                    onClick={() => setSelectedIndex(null)}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    ref={modalRef}
                >
                    {/* Navigation Arrows */}
                    <button
                        className="nav-arrow nav-prev"
                        onClick={(e) => { e.stopPropagation(); navigatePrev(); }}
                        aria-label="Previous image"
                    >
                        ‹
                    </button>

                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <img src={URL.createObjectURL(selectedImage.blob)} alt={selectedImage.name} />
                        <div className="modal-caption">
                            <span>{selectedImage.name}</span>
                            <span className="image-counter">{selectedIndex + 1} / {images.length}</span>
                            <span>{selectedImage.timestamp}</span>
                        </div>
                        <button className="close-modal" onClick={() => setSelectedIndex(null)}>CLOSE</button>
                    </div>

                    <button
                        className="nav-arrow nav-next"
                        onClick={(e) => { e.stopPropagation(); navigateNext(); }}
                        aria-label="Next image"
                    >
                        ›
                    </button>
                </div>
            )}
        </div>
    );
};

export default GalleryRoom;
