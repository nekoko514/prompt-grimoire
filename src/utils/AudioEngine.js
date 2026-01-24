class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.nodes = {}; // Store active oscillator/buffer nodes
        this.isPlaying = false;
        this.currentTrack = null;
        this.audioElement = null;
        this.isInitialized = false;
    }

    /**
     * Initialize AudioContext - should be called on user interaction for iOS
     */
    async init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.5;
        }

        // iOS Safari requires resume on user gesture
        if (this.ctx.state === 'suspended') {
            try {
                await this.ctx.resume();
                console.log('AudioContext resumed successfully');
            } catch (e) {
                console.error('Failed to resume AudioContext:', e);
            }
        }

        this.isInitialized = true;
    }

    setVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.1);
        }
        if (this.audioElement) {
            this.audioElement.volume = value;
        }
    }

    stop() {
        if (this.currentTrack && this.nodes[this.currentTrack]) {
            if (this.nodes[this.currentTrack].stop) {
                this.nodes[this.currentTrack].stop();
            }
            delete this.nodes[this.currentTrack];
        }

        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
            this.audioElement = null;
        }

        this.isPlaying = false;
        this.currentTrack = null;
    }

    async play(trackId) {
        // Init context first (includes resume for iOS)
        await this.init();

        // Stop current track
        this.stop();

        this.currentTrack = trackId;
        this.isPlaying = true;

        // Handle custom tracks (Blob URLs or Base64)
        if (typeof trackId === 'string' && (trackId.startsWith('blob:') || trackId.startsWith('data:'))) {
            this.audioElement = new Audio(trackId);
            // Safety check for masterGain
            const volume = (this.masterGain && this.masterGain.gain) ? this.masterGain.gain.value : 0.5;
            this.audioElement.volume = volume;
            this.audioElement.loop = true;

            try {
                await this.audioElement.play();
                this.nodes[trackId] = {
                    stop: () => {
                        if (this.audioElement) {
                            this.audioElement.pause();
                            this.audioElement = null;
                        }
                    }
                };
            } catch (e) {
                console.warn("Autoplay prevented or source invalid", e);
                this.isPlaying = false;
            }
            return;
        }

        // Handle synthesized tracks
        switch (trackId) {
            case 'static':
                this.playWhiteNoise();
                break;
            case 'rain':
                this.playPinkNoise();
                break;
            case 'void':
                this.playDrone();
                break;
            case 'underwater':
                this.playUnderwater();
                break;
            // Aesthetic placeholders (visual only for now, or future expansion)    
            case 'jazz':
            case 'humming':
            case 'screams':
                // No audio gen yet, just state
                console.log('Playing thematic track (visual only):', trackId);
                break;
            default:
                break;
        }
    }

    // --- Sound Generators ---

    playWhiteNoise() {
        if (!this.ctx) return;

        const bufferSize = 2 * this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;

        // Filter to make it sound more like radio static (Bandpass)
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 0.5;

        whiteNoise.connect(filter);
        filter.connect(this.masterGain);
        whiteNoise.start();

        this.nodes['static'] = {
            stop: () => {
                try { whiteNoise.stop(); } catch (e) { }
                try { whiteNoise.disconnect(); } catch (e) { }
            }
        };
    }

    playPinkNoise() {
        if (!this.ctx) return;

        const bufferSize = 2 * this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);

        // Approximate Pink Noise (1/f)
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;

        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11; // (roughly) compensate for gain
            b6 = white * 0.115926;
        }

        const pinkNoise = this.ctx.createBufferSource();
        pinkNoise.buffer = buffer;
        pinkNoise.loop = true;

        // Lowpass for rain effect
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        pinkNoise.connect(filter);
        filter.connect(this.masterGain);
        pinkNoise.start();

        this.nodes['rain'] = {
            stop: () => {
                try { pinkNoise.stop(); } catch (e) { }
                try { pinkNoise.disconnect(); } catch (e) { }
            }
        };
    }

    playDrone() {
        if (!this.ctx) return;

        // Eerie void drone - audible on mobile speakers
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const osc3 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        gain.gain.value = 0.4;

        // Higher base frequency for mobile audibility
        osc1.type = 'sine';
        osc1.frequency.value = 110; // A2 - audible on mobile

        osc2.type = 'sine';
        osc2.frequency.value = 113; // Slight detune for eerie beating

        // Add a higher harmonic for more presence
        osc3.type = 'triangle';
        osc3.frequency.value = 220; // A3 octave

        // Slow LFO for pulsing effect
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 0.2; // Slow pulse
        lfoGain.gain.value = 0.15;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();

        osc1.connect(gain);
        osc2.connect(gain);
        osc3.connect(gain);
        gain.connect(this.masterGain);

        osc1.start();
        osc2.start();
        osc3.start();

        this.nodes['void'] = {
            stop: () => {
                try {
                    osc1.stop();
                    osc2.stop();
                    osc3.stop();
                    lfo.stop();
                    gain.disconnect();
                } catch (e) { }
            }
        };
    }

    playUnderwater() {
        if (!this.ctx) return;

        // Underwater ambience: filtered noise + bubbles + depth
        const bufferSize = 2 * this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);

        // Brown noise for underwater rumble - louder
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 2.0; // Increased volume
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        // Low-pass filter for muffled effect
        const lpFilter = this.ctx.createBiquadFilter();
        lpFilter.type = 'lowpass';
        lpFilter.frequency.value = 300; // Slightly higher for more presence
        lpFilter.Q.value = 0.7;

        // Slow LFO for wavering
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 0.08;
        lfoGain.gain.value = 80;
        lfo.connect(lfoGain);
        lfoGain.connect(lpFilter.frequency);
        lfo.start();

        // Drone for depth - louder
        const drone = this.ctx.createOscillator();
        const droneGain = this.ctx.createGain();
        drone.type = 'sine';
        drone.frequency.value = 80; // Higher for mobile audibility
        droneGain.gain.value = 0.25;
        drone.connect(droneGain);
        droneGain.connect(this.masterGain);
        drone.start();

        // Connect main noise chain
        noise.connect(lpFilter);
        lpFilter.connect(this.masterGain);
        noise.start();

        // Bubble system - random pops!
        let bubbleIntervalId = null;
        let isActive = true;

        const createBubble = () => {
            if (!isActive || !this.ctx) return;
            const bubbleOsc = this.ctx.createOscillator();
            const bubbleGain = this.ctx.createGain();

            // Random frequency for each bubble (300-800Hz)
            bubbleOsc.type = 'sine';
            bubbleOsc.frequency.value = 300 + Math.random() * 500;

            // Quick envelope for "pop" sound
            bubbleGain.gain.setValueAtTime(0, this.ctx.currentTime);
            bubbleGain.gain.linearRampToValueAtTime(0.15 + Math.random() * 0.1, this.ctx.currentTime + 0.02);
            bubbleGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

            bubbleOsc.connect(bubbleGain);
            bubbleGain.connect(this.masterGain);
            bubbleOsc.start();
            bubbleOsc.stop(this.ctx.currentTime + 0.2);
        };

        // Random bubbles every 200-800ms
        const scheduleBubbles = () => {
            if (!isActive) return;
            createBubble();
            // Sometimes create multiple bubbles at once
            if (Math.random() > 0.6) {
                setTimeout(createBubble, 50 + Math.random() * 100);
            }
            bubbleIntervalId = setTimeout(scheduleBubbles, 200 + Math.random() * 600);
        };
        scheduleBubbles();

        this.nodes['underwater'] = {
            stop: () => {
                isActive = false;
                try {
                    noise.stop();
                    lfo.stop();
                    drone.stop();
                    lpFilter.disconnect();
                    droneGain.disconnect();
                    if (bubbleIntervalId) clearTimeout(bubbleIntervalId);
                } catch (e) { }
            }
        };
    }
}

export default new AudioEngine(); // Singleton
