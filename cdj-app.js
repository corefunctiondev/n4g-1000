class CDJApp {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.crossfaderGainA = null;
        this.crossfaderGainB = null;
        this.decks = {
            A: {
                track: null,
                isPlaying: false,
                isPaused: false,
                currentTime: 0,
                duration: 0,
                bpm: 0,
                tempo: 0,
                eq: { high: 0, mid: 0, low: 0 },
                volume: 0.75,
                source: null,
                gainNode: null,
                eqNodes: { high: null, mid: null, low: null },
                analyser: null,
                startTime: 0,
                pauseTime: 0,
                animationFrame: null
            },
            B: {
                track: null,
                isPlaying: false,
                isPaused: false,
                currentTime: 0,
                duration: 0,
                bpm: 0,
                tempo: 0,
                eq: { high: 0, mid: 0, low: 0 },
                volume: 0.75,
                source: null,
                gainNode: null,
                eqNodes: { high: null, mid: null, low: null },
                analyser: null,
                startTime: 0,
                pauseTime: 0,
                animationFrame: null
            }
        };
        this.crossfader = 0; // -1 = A, 0 = center, 1 = B
        this.masterVolume = 0.8;
        this.playbackOrder = [];
        
        this.init();
    }
    
    async init() {
        await this.initAudio();
        this.setupEventListeners();
        this.startRenderLoop();
    }
    
    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.audioContext.destination);
            
            // Create crossfader gains
            this.crossfaderGainA = this.audioContext.createGain();
            this.crossfaderGainB = this.audioContext.createGain();
            this.crossfaderGainA.connect(this.masterGain);
            this.crossfaderGainB.connect(this.masterGain);
            this.updateCrossfader();
            
            // Initialize deck audio nodes
            ['A', 'B'].forEach(deckId => {
                const deck = this.decks[deckId];
                deck.gainNode = this.audioContext.createGain();
                deck.gainNode.gain.value = deck.volume;
                
                // Create EQ nodes
                deck.eqNodes.high = this.audioContext.createBiquadFilter();
                deck.eqNodes.mid = this.audioContext.createBiquadFilter();
                deck.eqNodes.low = this.audioContext.createBiquadFilter();
                
                deck.eqNodes.high.type = 'highshelf';
                deck.eqNodes.high.frequency.value = 3200;
                deck.eqNodes.mid.type = 'peaking';
                deck.eqNodes.mid.frequency.value = 800;
                deck.eqNodes.low.type = 'lowshelf';
                deck.eqNodes.low.frequency.value = 320;
                
                // Create analyser
                deck.analyser = this.audioContext.createAnalyser();
                deck.analyser.fftSize = 1024;
                
                // Connect audio chain
                deck.gainNode.connect(deck.eqNodes.high);
                deck.eqNodes.high.connect(deck.eqNodes.mid);
                deck.eqNodes.mid.connect(deck.eqNodes.low);
                deck.eqNodes.low.connect(deck.analyser);
                deck.analyser.connect(deckId === 'A' ? this.crossfaderGainA : this.crossfaderGainB);
            });
            
            console.log('Audio system initialized successfully');
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }
    
    setupEventListeners() {
        // File upload handlers
        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const deckId = e.target.closest('.deck').dataset.deck;
                if (e.target.files[0]) {
                    this.loadTrack(deckId, e.target.files[0]);
                }
            });
        });
        
        // Play/Stop buttons
        document.querySelectorAll('.btn-play').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const deckId = e.target.closest('.deck').dataset.deck;
                this.togglePlayPause(deckId);
            });
        });
        
        document.querySelectorAll('.btn-stop').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const deckId = e.target.closest('.deck').dataset.deck;
                this.stop(deckId);
            });
        });
        
        // Sync buttons
        document.querySelectorAll('.btn-sync').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const deckId = e.target.closest('.deck').dataset.deck;
                this.sync(deckId);
            });
        });
        
        // Waveform click-to-seek
        document.querySelectorAll('.waveform-canvas').forEach(canvas => {
            canvas.addEventListener('click', (e) => {
                const deckId = e.target.closest('.deck').dataset.deck;
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const seekTime = (x / canvas.width) * this.decks[deckId].duration;
                this.seek(deckId, seekTime);
            });
        });
        
        // Control interactions
        this.setupControlInteractions();
    }
    
    setupControlInteractions() {
        // EQ knobs
        document.querySelectorAll('.knob').forEach(knob => {
            let isDragging = false;
            let startY = 0;
            let startValue = 0;
            
            knob.addEventListener('mousedown', (e) => {
                isDragging = true;
                startY = e.clientY;
                startValue = 0; // Default EQ position
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            });
            
            const handleMouseMove = (e) => {
                if (!isDragging) return;
                const deltaY = startY - e.clientY;
                const newValue = Math.max(-100, Math.min(100, startValue + deltaY));
                const deckId = knob.closest('.deck').dataset.deck;
                const eqBand = knob.dataset.eq;
                this.setEQ(deckId, eqBand, newValue);
            };
            
            const handleMouseUp = () => {
                isDragging = false;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        });
        
        // Tempo sliders
        document.querySelectorAll('.tempo-slider').forEach(slider => {
            slider.addEventListener('click', (e) => {
                const rect = slider.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = x / rect.width;
                const tempoValue = (percentage - 0.5) * 2 * 16; // ±16% range
                const deckId = slider.closest('.deck').dataset.deck;
                this.setTempo(deckId, tempoValue);
            });
        });
        
        // Crossfader
        const crossfader = document.querySelector('.crossfader');
        if (crossfader) {
            crossfader.addEventListener('click', (e) => {
                const rect = crossfader.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const value = (x / rect.width) * 2 - 1; // -1 to 1
                this.setCrossfader(value);
            });
        }
        
        // Volume faders
        document.querySelectorAll('.volume-fader').forEach(fader => {
            fader.addEventListener('click', (e) => {
                const rect = fader.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const value = 1 - (y / rect.height); // Inverted
                const channel = fader.dataset.channel;
                this.setVolume(channel, value);
            });
        });
    }
    
    async loadTrack(deckId, file) {
        try {
            const deck = this.decks[deckId];
            deck.track = file;
            
            // Update UI
            const deckElement = document.querySelector(`[data-deck="${deckId}"]`);
            deckElement.querySelector('.track-name').textContent = file.name;
            deckElement.classList.add('loading');
            
            // Resume audio context if needed
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Decode audio file
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            deck.audioBuffer = audioBuffer;
            deck.duration = audioBuffer.duration;
            deck.bpm = await this.analyzeBPM(audioBuffer);
            deck.waveformData = this.generateWaveformData(audioBuffer);
            
            // Update UI
            deckElement.classList.remove('loading');
            deckElement.querySelector('.bpm-value').textContent = deck.bpm.toFixed(1);
            
            console.log(`Track loaded on deck ${deckId}: ${file.name} (${deck.bpm} BPM)`);
        } catch (error) {
            console.error(`Failed to load track on deck ${deckId}:`, error);
            const deckElement = document.querySelector(`[data-deck="${deckId}"]`);
            deckElement.classList.remove('loading');
        }
    }
    
    togglePlayPause(deckId) {
        const deck = this.decks[deckId];
        if (!deck.audioBuffer) return;
        
        if (deck.isPlaying) {
            this.pause(deckId);
        } else {
            this.play(deckId);
        }
    }
    
    async play(deckId) {
        const deck = this.decks[deckId];
        if (!deck.audioBuffer) return;
        
        try {
            await this.audioContext.resume();
            
            // Stop current source if playing
            if (deck.source) {
                deck.source.stop();
                deck.source.disconnect();
            }
            
            // Create new source
            deck.source = this.audioContext.createBufferSource();
            deck.source.buffer = deck.audioBuffer;
            deck.source.connect(deck.gainNode);
            
            // Calculate start offset
            const offset = deck.isPaused ? deck.pauseTime : 0;
            
            // Apply tempo
            const playbackRate = 1 + (deck.tempo / 100);
            deck.source.playbackRate.value = playbackRate;
            
            deck.source.start(0, offset);
            deck.startTime = this.audioContext.currentTime - offset;
            deck.isPlaying = true;
            deck.isPaused = false;
            
            // Track playback order for sync
            if (!this.playbackOrder.includes(deckId)) {
                this.playbackOrder.push(deckId);
            }
            
            // Update UI
            const playBtn = document.querySelector(`[data-deck="${deckId}"] .btn-play`);
            playBtn.textContent = '⏸ PAUSE';
            playBtn.classList.add('active');
            
            console.log(`Playback started on deck ${deckId}`);
        } catch (error) {
            console.error(`Failed to play on deck ${deckId}:`, error);
        }
    }
    
    pause(deckId) {
        const deck = this.decks[deckId];
        if (!deck.isPlaying) return;
        
        if (deck.source) {
            deck.source.stop();
            deck.source.disconnect();
            deck.source = null;
        }
        
        deck.pauseTime = deck.currentTime;
        deck.isPlaying = false;
        deck.isPaused = true;
        
        // Update UI
        const playBtn = document.querySelector(`[data-deck="${deckId}"] .btn-play`);
        playBtn.textContent = '▶ PLAY';
        playBtn.classList.remove('active');
    }
    
    stop(deckId) {
        const deck = this.decks[deckId];
        
        if (deck.source) {
            deck.source.stop();
            deck.source.disconnect();
            deck.source = null;
        }
        
        deck.isPlaying = false;
        deck.isPaused = false;
        deck.currentTime = 0;
        deck.pauseTime = 0;
        
        // Remove from playback order
        this.playbackOrder = this.playbackOrder.filter(id => id !== deckId);
        
        // Update UI
        const deckElement = document.querySelector(`[data-deck="${deckId}"]`);
        const playBtn = deckElement.querySelector('.btn-play');
        playBtn.textContent = '▶ PLAY';
        playBtn.classList.remove('active');
        deckElement.querySelector('.time-current').textContent = '00:00.0';
    }
    
    seek(deckId, time) {
        const deck = this.decks[deckId];
        if (!deck.audioBuffer || time < 0 || time > deck.duration) return;
        
        deck.pauseTime = time;
        deck.currentTime = time;
        
        if (deck.isPlaying) {
            // Restart playback from new position
            this.pause(deckId);
            setTimeout(() => this.play(deckId), 50);
        }
    }
    
    setTempo(deckId, tempo) {
        const deck = this.decks[deckId];
        deck.tempo = Math.max(-50, Math.min(50, tempo));
        
        if (deck.source) {
            const playbackRate = 1 + (deck.tempo / 100);
            deck.source.playbackRate.value = playbackRate;
        }
        
        // Update BPM display
        const originalBPM = deck.bpm / (1 + (deck.tempo / 100)); // Get original BPM
        const newBPM = originalBPM * (1 + (deck.tempo / 100));
        
        const deckElement = document.querySelector(`[data-deck="${deckId}"]`);
        deckElement.querySelector('.bpm-value').textContent = newBPM.toFixed(1);
        deckElement.querySelector('.tempo-value').textContent = `${deck.tempo >= 0 ? '+' : ''}${deck.tempo.toFixed(1)}%`;
    }
    
    setEQ(deckId, band, value) {
        const deck = this.decks[deckId];
        deck.eq[band] = value;
        
        if (deck.eqNodes[band]) {
            const gain = value * 0.3; // Convert to dB
            deck.eqNodes[band].gain.value = gain;
        }
    }
    
    setVolume(channel, value) {
        if (channel === 'master') {
            this.masterVolume = value;
            if (this.masterGain) {
                this.masterGain.gain.value = value;
            }
        } else {
            const deck = this.decks[channel];
            deck.volume = value;
            if (deck.gainNode) {
                deck.gainNode.gain.value = value;
            }
        }
    }
    
    setCrossfader(value) {
        this.crossfader = Math.max(-1, Math.min(1, value));
        this.updateCrossfader();
    }
    
    updateCrossfader() {
        if (!this.crossfaderGainA || !this.crossfaderGainB) return;
        
        // Calculate gain values based on crossfader position
        const gainA = this.crossfader <= 0 ? 1 : 1 - this.crossfader;
        const gainB = this.crossfader >= 0 ? 1 : 1 + this.crossfader;
        
        this.crossfaderGainA.gain.value = gainA;
        this.crossfaderGainB.gain.value = gainB;
    }
    
    sync(deckId) {
        if (this.playbackOrder.length === 0) {
            console.log('No decks are playing - sync requires a playing deck');
            return;
        }
        
        const masterDeckId = this.playbackOrder[0];
        if (masterDeckId === deckId) {
            console.log(`Deck ${deckId} is the master deck`);
            return;
        }
        
        const masterDeck = this.decks[masterDeckId];
        const targetDeck = this.decks[deckId];
        
        if (!targetDeck.audioBuffer || !masterDeck.audioBuffer) return;
        
        // Calculate tempo adjustment needed
        const masterCurrentBPM = masterDeck.bpm * (1 + (masterDeck.tempo / 100));
        const targetOriginalBPM = targetDeck.bpm / (1 + (targetDeck.tempo / 100));
        const tempoAdjustment = ((masterCurrentBPM / targetOriginalBPM) - 1) * 100;
        
        this.setTempo(deckId, Math.max(-50, Math.min(50, tempoAdjustment)));
        
        console.log(`Deck ${deckId} synced to deck ${masterDeckId}`);
    }
    
    startRenderLoop() {
        const render = () => {
            this.updateTimeDisplays();
            this.renderWaveforms();
            requestAnimationFrame(render);
        };
        render();
    }
    
    updateTimeDisplays() {
        ['A', 'B'].forEach(deckId => {
            const deck = this.decks[deckId];
            if (deck.isPlaying && deck.audioBuffer) {
                const elapsed = this.audioContext.currentTime - deck.startTime;
                deck.currentTime = Math.min(elapsed, deck.duration);
            }
            
            const deckElement = document.querySelector(`[data-deck="${deckId}"]`);
            if (deckElement) {
                const currentTimeEl = deckElement.querySelector('.time-current');
                const remainingTimeEl = deckElement.querySelector('.time-remaining');
                
                if (currentTimeEl) currentTimeEl.textContent = this.formatTime(deck.currentTime);
                if (remainingTimeEl && deck.duration > 0) {
                    remainingTimeEl.textContent = '-' + this.formatTime(deck.duration - deck.currentTime);
                }
            }
        });
    }
    
    renderWaveforms() {
        ['A', 'B'].forEach(deckId => {
            const deck = this.decks[deckId];
            const canvas = document.querySelector(`[data-deck="${deckId}"] .waveform-canvas`);
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            
            // Clear canvas
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            if (deck.waveformData) {
                // Draw static waveform
                ctx.fillStyle = '#333';
                const barWidth = canvas.width / deck.waveformData.length;
                
                for (let i = 0; i < deck.waveformData.length; i++) {
                    const amplitude = deck.waveformData[i];
                    const barHeight = amplitude * canvas.height * 0.8;
                    const x = i * barWidth;
                    const y = (canvas.height - barHeight) / 2;
                    
                    ctx.fillRect(x, y, barWidth - 1, barHeight);
                }
                
                // Draw playhead
                if (deck.duration > 0) {
                    const playheadX = (deck.currentTime / deck.duration) * canvas.width;
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#000';
                    ctx.shadowBlur = 2;
                    ctx.beginPath();
                    ctx.moveTo(playheadX, 0);
                    ctx.lineTo(playheadX, canvas.height);
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
            }
        });
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const wholeSeconds = Math.floor(remainingSeconds);
        const decimals = Math.floor((remainingSeconds - wholeSeconds) * 10);
        return `${minutes.toString().padStart(2, '0')}:${wholeSeconds.toString().padStart(2, '0')}.${decimals}`;
    }
    
    async analyzeBPM(audioBuffer) {
        // Simplified BPM detection
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        
        // Use a basic peak detection algorithm
        const peaks = [];
        const windowSize = Math.floor(sampleRate * 0.1); // 100ms windows
        
        for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
            let sum = 0;
            for (let j = i; j < i + windowSize; j++) {
                sum += Math.abs(channelData[j]);
            }
            peaks.push(sum / windowSize);
        }
        
        // Find tempo based on peak intervals
        const intervals = [];
        let lastPeak = 0;
        const threshold = Math.max(...peaks) * 0.6;
        
        for (let i = 1; i < peaks.length; i++) {
            if (peaks[i] > threshold && peaks[i] > peaks[i-1] && peaks[i] > peaks[i+1]) {
                if (lastPeak > 0) {
                    intervals.push((i - lastPeak) * 0.1); // Convert to seconds
                }
                lastPeak = i;
            }
        }
        
        if (intervals.length === 0) return 120; // Default BPM
        
        // Calculate average interval and convert to BPM
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const bpm = 60 / avgInterval;
        
        // Ensure reasonable BPM range
        return Math.max(60, Math.min(200, bpm));
    }
    
    generateWaveformData(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const samples = 200; // Number of waveform bars
        const samplesPerPixel = Math.floor(channelData.length / samples);
        const waveformData = new Array(samples);
        
        for (let i = 0; i < samples; i++) {
            let sum = 0;
            const start = i * samplesPerPixel;
            const end = Math.min(start + samplesPerPixel, channelData.length);
            
            for (let j = start; j < end; j++) {
                sum += Math.abs(channelData[j]);
            }
            waveformData[i] = sum / (end - start);
        }
        
        return waveformData;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new CDJApp();
});