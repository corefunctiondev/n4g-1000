# CDJ Integration Guide - Working Version

## Complete HTML + CSS + JavaScript

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>N4G-1000 Digital Turntable Interface</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            color: white;
            overflow: hidden;
            height: 100vh;
            width: 100vw;
        }
        
        .fullscreen-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            z-index: 1000;
        }
        
        .cdj-container {
            display: flex;
            gap: 20px;
            padding: 20px;
            height: 100vh;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
        }
        
        .deck {
            background: linear-gradient(145deg, #2d2d2d, #1e1e1e);
            border: 3px solid #00ff9f;
            border-radius: 15px;
            padding: 25px;
            width: 650px;
            height: 90vh;
            box-shadow: 0 0 30px rgba(0, 255, 159, 0.3), 0 8px 32px rgba(0, 0, 0, 0.5);
            position: relative;
            overflow-y: auto;
        }
        
        .deck-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #00ff9f;
        }
        
        .deck-title {
            font-size: 22px;
            font-weight: bold;
            color: #00ff9f;
            text-shadow: 0 0 10px rgba(0, 255, 159, 0.5);
        }
        
        .deck-status {
            font-size: 16px;
            color: #00ff9f;
            font-weight: bold;
            background: rgba(0, 255, 159, 0.1);
            padding: 5px 10px;
            border-radius: 5px;
            border: 1px solid #00ff9f;
        }
        
        .waveform-container {
            background: #000;
            border: 3px solid #00ff9f;
            border-radius: 10px;
            height: 160px;
            margin-bottom: 20px;
            position: relative;
            overflow: hidden;
            box-shadow: inset 0 0 20px rgba(0, 255, 159, 0.2);
        }
        
        .waveform-canvas {
            width: 100%;
            height: 100%;
            cursor: crosshair;
        }
        
        .track-info {
            margin-bottom: 20px;
            background: rgba(0, 255, 159, 0.05);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid rgba(0, 255, 159, 0.3);
        }
        
        .track-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #ffffff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .time-display {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .time-current {
            color: #ff8c00;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            text-shadow: 0 0 5px rgba(255, 140, 0, 0.5);
        }
        
        .bpm-display {
            text-align: center;
            background: rgba(0, 204, 255, 0.1);
            padding: 10px;
            border-radius: 10px;
            border: 2px solid #00ccff;
        }
        
        .bpm-value {
            font-size: 28px;
            font-weight: bold;
            color: #00ccff;
            text-shadow: 0 0 10px rgba(0, 204, 255, 0.5);
            line-height: 1;
        }
        
        .bpm-label {
            font-size: 14px;
            color: #00ccff;
            margin-top: 2px;
        }
        
        .time-remaining {
            color: #ff8c00;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            text-shadow: 0 0 5px rgba(255, 140, 0, 0.5);
        }
        
        .controls {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            justify-content: center;
        }
        
        .btn {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            background: linear-gradient(145deg, #333, #222);
            color: white;
            border: 2px solid #555;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .btn:hover {
            background: linear-gradient(145deg, #444, #333);
            border-color: #777;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .btn.active {
            background: linear-gradient(145deg, #00ff9f, #00cc7f);
            color: #000;
            border-color: #00ff9f;
            box-shadow: 0 0 20px rgba(0, 255, 159, 0.4);
        }
        
        .btn-play {
            background: linear-gradient(145deg, #28a745, #1e7e34);
            border-color: #28a745;
        }
        
        .btn-play:hover {
            background: linear-gradient(145deg, #34ce57, #28a745);
            box-shadow: 0 0 20px rgba(40, 167, 69, 0.4);
        }
        
        .btn-stop {
            background: linear-gradient(145deg, #dc3545, #c82333);
            border-color: #dc3545;
        }
        
        .btn-stop:hover {
            background: linear-gradient(145deg, #e74c3c, #dc3545);
            box-shadow: 0 0 20px rgba(220, 53, 69, 0.4);
        }
        
        .btn-load {
            background: linear-gradient(145deg, #007bff, #0056b3);
            border-color: #007bff;
        }
        
        .btn-load:hover {
            background: linear-gradient(145deg, #0056b3, #004085);
            box-shadow: 0 0 20px rgba(0, 123, 255, 0.4);
        }
        
        .btn-sync {
            background: linear-gradient(145deg, #6f42c1, #5a32a3);
            border-color: #6f42c1;
        }
        
        .btn-sync:hover {
            background: linear-gradient(145deg, #7952b3, #6f42c1);
            box-shadow: 0 0 20px rgba(111, 66, 193, 0.4);
        }
        
        .eq-section {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin-bottom: 20px;
            background: rgba(0, 255, 159, 0.05);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid rgba(0, 255, 159, 0.3);
        }
        
        .eq-knob {
            text-align: center;
        }
        
        .eq-label {
            font-size: 14px;
            color: #00ff9f;
            margin-bottom: 8px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .knob {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #555, #222);
            border: 3px solid #00ff9f;
            position: relative;
            cursor: pointer;
            margin: 0 auto;
            box-shadow: 0 0 15px rgba(0, 255, 159, 0.3);
            transition: all 0.3s;
        }
        
        .knob:hover {
            box-shadow: 0 0 25px rgba(0, 255, 159, 0.5);
            transform: scale(1.1);
        }
        
        .knob::after {
            content: '';
            position: absolute;
            top: 5px;
            left: 50%;
            transform: translateX(-50%);
            width: 3px;
            height: 18px;
            background: #00ff9f;
            border-radius: 2px;
            box-shadow: 0 0 5px rgba(0, 255, 159, 0.8);
        }
        
        .tempo-section {
            text-align: center;
            margin-bottom: 20px;
            background: rgba(0, 204, 255, 0.05);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid rgba(0, 204, 255, 0.3);
        }
        
        .tempo-label {
            font-size: 14px;
            color: #00ccff;
            margin-bottom: 8px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .tempo-value {
            color: #00ccff;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            margin-bottom: 15px;
            font-weight: bold;
            text-shadow: 0 0 5px rgba(0, 204, 255, 0.5);
        }
        
        .tempo-slider {
            width: 250px;
            height: 8px;
            background: linear-gradient(90deg, #333, #555, #333);
            border-radius: 4px;
            margin: 0 auto;
            position: relative;
            cursor: pointer;
            border: 1px solid #00ccff;
        }
        
        .tempo-slider::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 16px;
            height: 16px;
            background: #00ccff;
            border-radius: 50%;
            border: 2px solid #fff;
            box-shadow: 0 0 10px rgba(0, 204, 255, 0.8);
        }
        
        .mixer {
            background: linear-gradient(145deg, #2d2d2d, #1e1e1e);
            border: 3px solid #ff6b35;
            border-radius: 15px;
            padding: 25px;
            width: 250px;
            height: 90vh;
            box-shadow: 0 0 30px rgba(255, 107, 53, 0.3), 0 8px 32px rgba(0, 0, 0, 0.5);
            overflow-y: auto;
        }
        
        .mixer-title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            color: #ff6b35;
            margin-bottom: 25px;
            text-shadow: 0 0 10px rgba(255, 107, 53, 0.5);
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .crossfader-section {
            text-align: center;
            margin-bottom: 25px;
            background: rgba(255, 107, 53, 0.05);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid rgba(255, 107, 53, 0.3);
        }
        
        .crossfader {
            width: 180px;
            height: 8px;
            background: linear-gradient(90deg, #00ff9f, #333, #00ccff);
            border-radius: 4px;
            margin: 15px auto;
            position: relative;
            cursor: pointer;
            border: 1px solid #ff6b35;
        }
        
        .crossfader::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 24px;
            height: 24px;
            background: #ff6b35;
            border-radius: 50%;
            border: 3px solid #fff;
            box-shadow: 0 0 15px rgba(255, 107, 53, 0.8);
        }
        
        .volume-section {
            margin-bottom: 20px;
            text-align: center;
        }
        
        .volume-label {
            font-size: 14px;
            color: #ff6b35;
            text-align: center;
            margin-bottom: 8px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .volume-fader {
            width: 8px;
            height: 120px;
            background: linear-gradient(180deg, #ff6b35, #333, #ff6b35);
            border-radius: 4px;
            margin: 0 auto;
            position: relative;
            cursor: pointer;
            border: 1px solid #ff6b35;
        }
        
        .volume-fader::after {
            content: '';
            position: absolute;
            bottom: 30%;
            left: 50%;
            transform: translateX(-50%);
            width: 24px;
            height: 16px;
            background: #ff6b35;
            border-radius: 8px;
            border: 2px solid #fff;
            box-shadow: 0 0 10px rgba(255, 107, 53, 0.8);
        }
        
        .hidden {
            display: none;
        }
        
        .loading {
            opacity: 0.6;
            pointer-events: none;
        }
        
        .bars-display {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
        
        .bars-left {
            color: #ff8c00;
        }
        
        .bars-right {
            color: #00ff9f;
        }
        
        .cdj-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 10px;
            font-size: 12px;
            color: #999;
        }
        
        @media (max-width: 1600px) {
            .deck {
                width: 550px;
            }
            
            .mixer {
                width: 200px;
            }
        }
        
        @media (max-width: 1200px) {
            .cdj-container {
                flex-direction: column;
                height: auto;
                overflow-y: auto;
                padding: 10px;
            }
            
            .deck {
                width: 95%;
                height: auto;
                margin-bottom: 20px;
            }
            
            .mixer {
                width: 95%;
                height: auto;
            }
        }
        
        ::-webkit-scrollbar {
            width: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: #1a1a1a;
        }
        
        ::-webkit-scrollbar-thumb {
            background: #00ff9f;
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: #00cc7f;
        }
    </style>
</head>
<body>
    <div class="fullscreen-container">
        <div class="cdj-container">
            <!-- Deck A -->
            <div class="deck" data-deck="A">
                <div class="deck-header">
                    <div class="deck-title">CDJ-3000</div>
                    <div class="deck-status">READY</div>
                </div>
                
                <div class="bars-display">
                    <div class="bars-left">0.1 Bars</div>
                    <div class="bars-right">0.1 Bars</div>
                </div>
                
                <div class="waveform-container">
                    <canvas class="waveform-canvas" width="580" height="160"></canvas>
                </div>
                
                <div class="track-info">
                    <div class="track-name">No Track Loaded</div>
                    <div class="time-display">
                        <div class="time-current">00:00.0</div>
                        <div class="bpm-display">
                            <div class="bpm-value">---.-</div>
                            <div class="bpm-label">BPM</div>
                        </div>
                        <div class="time-remaining">--:--</div>
                    </div>
                    <div class="cdj-info">
                        <span>A.HOT CUE</span>
                        <span class="tempo-display">0.0%</span>
                        <span>TRACK 01</span>
                    </div>
                </div>
                
                <div class="controls">
                    <label class="btn btn-load">
                        LOAD TRACK
                        <input type="file" accept="audio/*" class="hidden">
                    </label>
                    <button class="btn btn-sync">SYNC</button>
                </div>
                
                <div class="controls">
                    <button class="btn btn-play">▶ PLAY</button>
                    <button class="btn btn-stop">⏹ STOP</button>
                </div>
                
                <div class="eq-section">
                    <div class="eq-knob">
                        <div class="eq-label">HIGH</div>
                        <div class="knob" data-eq="high"></div>
                    </div>
                    <div class="eq-knob">
                        <div class="eq-label">MID</div>
                        <div class="knob" data-eq="mid"></div>
                    </div>
                    <div class="eq-knob">
                        <div class="eq-label">LOW</div>
                        <div class="knob" data-eq="low"></div>
                    </div>
                </div>
                
                <div class="tempo-section">
                    <div class="tempo-label">TEMPO</div>
                    <div class="tempo-value">0.0%</div>
                    <div class="tempo-slider"></div>
                </div>
            </div>
            
            <!-- Mixer -->
            <div class="mixer">
                <div class="mixer-title">MIXER</div>
                
                <div class="crossfader-section">
                    <div class="volume-label">CROSSFADER</div>
                    <div class="crossfader"></div>
                </div>
                
                <div class="volume-section">
                    <div class="volume-label">CH A</div>
                    <div class="volume-fader" data-channel="A"></div>
                </div>
                
                <div class="volume-section">
                    <div class="volume-label">CH B</div>
                    <div class="volume-fader" data-channel="B"></div>
                </div>
                
                <div class="volume-section">
                    <div class="volume-label">MASTER</div>
                    <div class="volume-fader" data-channel="master"></div>
                </div>
            </div>
            
            <!-- Deck B -->
            <div class="deck" data-deck="B">
                <div class="deck-header">
                    <div class="deck-title">CDJ-3000</div>
                    <div class="deck-status">READY</div>
                </div>
                
                <div class="bars-display">
                    <div class="bars-left">0.1 Bars</div>
                    <div class="bars-right">0.1 Bars</div>
                </div>
                
                <div class="waveform-container">
                    <canvas class="waveform-canvas" width="580" height="160"></canvas>
                </div>
                
                <div class="track-info">
                    <div class="track-name">No Track Loaded</div>
                    <div class="time-display">
                        <div class="time-current">00:00.0</div>
                        <div class="bpm-display">
                            <div class="bpm-value">---.-</div>
                            <div class="bpm-label">BPM</div>
                        </div>
                        <div class="time-remaining">--:--</div>
                    </div>
                    <div class="cdj-info">
                        <span>A.HOT CUE</span>
                        <span class="tempo-display">0.0%</span>
                        <span>TRACK 01</span>
                    </div>
                </div>
                
                <div class="controls">
                    <label class="btn btn-load">
                        LOAD TRACK
                        <input type="file" accept="audio/*" class="hidden">
                    </label>
                    <button class="btn btn-sync">SYNC</button>
                </div>
                
                <div class="controls">
                    <button class="btn btn-play">▶ PLAY</button>
                    <button class="btn btn-stop">⏹ STOP</button>
                </div>
                
                <div class="eq-section">
                    <div class="eq-knob">
                        <div class="eq-label">HIGH</div>
                        <div class="knob" data-eq="high"></div>
                    </div>
                    <div class="eq-knob">
                        <div class="eq-label">MID</div>
                        <div class="knob" data-eq="mid"></div>
                    </div>
                    <div class="eq-knob">
                        <div class="eq-label">LOW</div>
                        <div class="knob" data-eq="low"></div>
                    </div>
                </div>
                
                <div class="tempo-section">
                    <div class="tempo-label">TEMPO</div>
                    <div class="tempo-value">0.0%</div>
                    <div class="tempo-slider"></div>
                </div>
            </div>
        </div>
    </div>

    <script>
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
                this.crossfader = 0;
                this.masterVolume = 0.8;
                this.playbackOrder = [];
                
                this.init();
            }
            
            async init() {
                console.log('Initializing CDJ App...');
                await this.initAudio();
                this.setupEventListeners();
                this.startRenderLoop();
                console.log('CDJ App initialized successfully');
            }
            
            async initAudio() {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    console.log('Audio context created:', this.audioContext.state);
                    
                    this.masterGain = this.audioContext.createGain();
                    this.masterGain.gain.value = this.masterVolume;
                    this.masterGain.connect(this.audioContext.destination);
                    
                    this.crossfaderGainA = this.audioContext.createGain();
                    this.crossfaderGainB = this.audioContext.createGain();
                    this.crossfaderGainA.connect(this.masterGain);
                    this.crossfaderGainB.connect(this.masterGain);
                    this.updateCrossfader();
                    
                    ['A', 'B'].forEach(deckId => {
                        const deck = this.decks[deckId];
                        deck.gainNode = this.audioContext.createGain();
                        deck.gainNode.gain.value = deck.volume;
                        
                        deck.eqNodes.high = this.audioContext.createBiquadFilter();
                        deck.eqNodes.mid = this.audioContext.createBiquadFilter();
                        deck.eqNodes.low = this.audioContext.createBiquadFilter();
                        
                        deck.eqNodes.high.type = 'highshelf';
                        deck.eqNodes.high.frequency.value = 3200;
                        deck.eqNodes.mid.type = 'peaking';
                        deck.eqNodes.mid.frequency.value = 800;
                        deck.eqNodes.low.type = 'lowshelf';
                        deck.eqNodes.low.frequency.value = 320;
                        
                        deck.analyser = this.audioContext.createAnalyser();
                        deck.analyser.fftSize = 1024;
                        
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
                console.log('Setting up event listeners...');
                
                // File upload handlers
                document.querySelectorAll('input[type="file"]').forEach(input => {
                    input.addEventListener('change', (e) => {
                        const deckId = e.target.closest('.deck').dataset.deck;
                        if (e.target.files[0]) {
                            console.log(`Loading track on deck ${deckId}`);
                            this.loadTrack(deckId, e.target.files[0]);
                        }
                    });
                });
                
                // Play/Pause buttons
                document.querySelectorAll('.btn-play').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const deckId = e.target.closest('.deck').dataset.deck;
                        console.log(`Play/Pause clicked for deck ${deckId}`);
                        this.togglePlayPause(deckId);
                    });
                });
                
                // Stop buttons
                document.querySelectorAll('.btn-stop').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const deckId = e.target.closest('.deck').dataset.deck;
                        console.log(`Stop clicked for deck ${deckId}`);
                        this.stop(deckId);
                    });
                });
                
                // Sync buttons
                document.querySelectorAll('.btn-sync').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const deckId = e.target.closest('.deck').dataset.deck;
                        console.log(`Sync clicked for deck ${deckId}`);
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
                        console.log(`Seeking deck ${deckId} to ${seekTime.toFixed(2)}s`);
                        this.seek(deckId, seekTime);
                    });
                });
                
                this.setupControlInteractions();
                console.log('Event listeners set up successfully');
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
                        startValue = 0;
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
                        const tempoValue = (percentage - 0.5) * 2 * 16;
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
                        const value = (x / rect.width) * 2 - 1;
                        this.setCrossfader(value);
                    });
                }
                
                // Volume faders
                document.querySelectorAll('.volume-fader').forEach(fader => {
                    fader.addEventListener('click', (e) => {
                        const rect = fader.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        const value = 1 - (y / rect.height);
                        const channel = fader.dataset.channel;
                        this.setVolume(channel, value);
                    });
                });
            }
            
            async loadTrack(deckId, file) {
                try {
                    const deck = this.decks[deckId];
                    deck.track = file;
                    
                    const deckElement = document.querySelector(`[data-deck="${deckId}"]`);
                    deckElement.querySelector('.track-name').textContent = file.name;
                    deckElement.classList.add('loading');
                    
                    if (this.audioContext.state === 'suspended') {
                        await this.audioContext.resume();
                        console.log('Audio context resumed');
                    }
                    
                    console.log(`Decoding audio file: ${file.name}`);
                    const arrayBuffer = await file.arrayBuffer();
                    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    
                    deck.audioBuffer = audioBuffer;
                    deck.duration = audioBuffer.duration;
                    deck.bpm = await this.analyzeBPM(audioBuffer);
                    deck.waveformData = this.generateWaveformData(audioBuffer);
                    
                    deckElement.classList.remove('loading');
                    deckElement.querySelector('.bpm-value').textContent = deck.bpm.toFixed(1);
                    
                    console.log(`Track loaded successfully on deck ${deckId}: ${file.name} (${deck.bpm} BPM)`);
                } catch (error) {
                    console.error(`Failed to load track on deck ${deckId}:`, error);
                    const deckElement = document.querySelector(`[data-deck="${deckId}"]`);
                    deckElement.classList.remove('loading');
                }
            }
            
            togglePlayPause(deckId) {
                const deck = this.decks[deckId];
                if (!deck.audioBuffer) {
                    console.log(`No track loaded on deck ${deckId}`);
                    return;
                }
                
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
                    
                    if (deck.source) {
                        deck.source.stop();
                        deck.source.disconnect();
                    }
                    
                    deck.source = this.audioContext.createBufferSource();
                    deck.source.buffer = deck.audioBuffer;
                    deck.source.connect(deck.gainNode);
                    
                    const offset = deck.isPaused ? deck.pauseTime : 0;
                    const playbackRate = 1 + (deck.tempo / 100);
                    deck.source.playbackRate.value = playbackRate;
                    
                    deck.source.start(0, offset);
                    deck.startTime = this.audioContext.currentTime - offset;
                    deck.isPlaying = true;
                    deck.isPaused = false;
                    
                    if (!this.playbackOrder.includes(deckId)) {
                        this.playbackOrder.push(deckId);
                    }
                    
                    const playBtn = document.querySelector(`[data-deck="${deckId}"] .btn-play`);
                    playBtn.textContent = '⏸ PAUSE';
                    playBtn.classList.add('active');
                    
                    console.log(`Playback started on deck ${deckId} at offset ${offset.toFixed(2)}s`);
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
                
                const playBtn = document.querySelector(`[data-deck="${deckId}"] .btn-play`);
                playBtn.textContent = '▶ PLAY';
                playBtn.classList.remove('active');
                
                console.log(`Playback paused on deck ${deckId} at ${deck.pauseTime.toFixed(2)}s`);
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
                
                this.playbackOrder = this.playbackOrder.filter(id => id !== deckId);
                
                const deckElement = document.querySelector(`[data-deck="${deckId}"]`);
                const playBtn = deckElement.querySelector('.btn-play');
                playBtn.textContent = '▶ PLAY';
                playBtn.classList.remove('active');
                deckElement.querySelector('.time-current').textContent = '00:00.0';
                
                console.log(`Playback stopped on deck ${deckId}`);
            }
            
            seek(deckId, time) {
                const deck = this.decks[deckId];
                if (!deck.audioBuffer || time < 0 || time > deck.duration) return;
                
                deck.pauseTime = time;
                deck.currentTime = time;
                
                if (deck.isPlaying) {
                    if (deck.source) {
                        deck.source.stop();
                        deck.source.disconnect();
                    }
                    
                    deck.source = this.audioContext.createBufferSource();
                    deck.source.buffer = deck.audioBuffer;
                    deck.source.connect(deck.gainNode);
                    
                    const playbackRate = 1 + (deck.tempo / 100);
                    deck.source.playbackRate.value = playbackRate;
                    
                    deck.source.start(0, time);
                    deck.startTime = this.audioContext.currentTime - time;
                    
                    console.log(`Seeked deck ${deckId} to ${time.toFixed(2)}s during playback`);
                } else {
                    console.log(`Seeked deck ${deckId} to ${time.toFixed(2)}s while paused`);
                }
            }
            
            setTempo(deckId, tempo) {
                const deck = this.decks[deckId];
                deck.tempo = Math.max(-50, Math.min(50, tempo));
                
                if (deck.source) {
                    const playbackRate = 1 + (deck.tempo / 100);
                    deck.source.playbackRate.value = playbackRate;
                }
                
                if (deck.bpm > 0) {
                    const originalBPM = deck.bpm / (1 + (deck.tempo / 100));
                    const newBPM = originalBPM * (1 + (deck.tempo / 100));
                    
                    const deckElement = document.querySelector(`[data-deck="${deckId}"]`);
                    deckElement.querySelector('.bpm-value').textContent = newBPM.toFixed(1);
                    deckElement.querySelector('.tempo-value').textContent = `${deck.tempo >= 0 ? '+' : ''}${deck.tempo.toFixed(1)}%`;
                }
            }
            
            setEQ(deckId, band, value) {
                const deck = this.decks[deckId];
                deck.eq[band] = value;
                
                if (deck.eqNodes[band]) {
                    const gain = value * 0.3;
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
                    if (deck) {
                        deck.volume = value;
                        if (deck.gainNode) {
                            deck.gainNode.gain.value = value;
                        }
                    }
                }
            }
            
            setCrossfader(value) {
                this.crossfader = Math.max(-1, Math.min(1, value));
                this.updateCrossfader();
            }
            
            updateCrossfader() {
                if (!this.crossfaderGainA || !this.crossfaderGainB) return;
                
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
                
                const masterCurrentBPM = masterDeck.bpm * (1 + (masterDeck.tempo / 100));
                const targetOriginalBPM = targetDeck.bpm / (1 + (targetDeck.tempo / 100));
                const tempoAdjustment = ((masterCurrentBPM / targetOriginalBPM) - 1) * 100;
                
                this.setTempo(deckId, Math.max(-50, Math.min(50, tempoAdjustment)));
                
                console.log(`Deck ${deckId} synced to deck ${masterDeckId} (${tempoAdjustment.toFixed(1)}%)`);
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
                        
                        // Update bars display
                        if (deck.bpm > 0) {
                            const beatsPerSecond = deck.bpm / 60;
                            const currentBeat = deck.currentTime * beatsPerSecond;
                            const currentBar = Math.floor(currentBeat / 4) + 1;
                            const beatInBar = Math.floor(currentBeat % 4) + 1;
                            
                            const barsLeftEl = deckElement.querySelector('.bars-left');
                            if (barsLeftEl) {
                                barsLeftEl.textContent = `${currentBar}.${beatInBar} Bars`;
                            }
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
                    
                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    if (deck.waveformData && deck.waveformData.length > 0) {
                        ctx.fillStyle = '#333';
                        const barWidth = canvas.width / deck.waveformData.length;
                        
                        for (let i = 0; i < deck.waveformData.length; i++) {
                            const amplitude = deck.waveformData[i];
                            const barHeight = amplitude * canvas.height * 0.8;
                            const x = i * barWidth;
                            const y = (canvas.height - barHeight) / 2;
                            
                            ctx.fillRect(x, y, barWidth - 1, barHeight);
                        }
                        
                        // Draw beat grid
                        if (deck.bpm > 0 && deck.duration > 0) {
                            const beatInterval = 60 / deck.bpm;
                            const pixelsPerSecond = canvas.width / deck.duration;
                            const beatWidth = beatInterval * pixelsPerSecond;
                            
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                            ctx.lineWidth = 1;
                            
                            for (let beat = 0; beat * beatWidth < canvas.width; beat++) {
                                const x = beat * beatWidth;
                                ctx.beginPath();
                                ctx.moveTo(x, 0);
                                ctx.lineTo(x, canvas.height);
                                ctx.stroke();
                            }
                        }
                        
                        // Draw playhead
                        if (deck.duration > 0) {
                            const playheadX = (deck.currentTime / deck.duration) * canvas.width;
                            
                            ctx.strokeStyle = '#ffffff';
                            ctx.lineWidth = 3;
                            ctx.shadowColor = '#000000';
                            ctx.shadowBlur = 2;
                            ctx.beginPath();
                            ctx.moveTo(playheadX, 0);
                            ctx.lineTo(playheadX, canvas.height);
                            ctx.stroke();
                            ctx.shadowBlur = 0;
                            
                            // Playhead triangle
                            ctx.fillStyle = '#ffffff';
                            ctx.strokeStyle = '#000000';
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(playheadX - 6, 0);
                            ctx.lineTo(playheadX + 6, 0);
                            ctx.lineTo(playheadX, 12);
                            ctx.closePath();
                            ctx.fill();
                            ctx.stroke();
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
                const channelData = audioBuffer.getChannelData(0);
                const sampleRate = audioBuffer.sampleRate;
                
                const peaks = [];
                const windowSize = Math.floor(sampleRate * 0.1);
                
                for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
                    let sum = 0;
                    for (let j = i; j < i + windowSize; j++) {
                        sum += Math.abs(channelData[j]);
                    }
                    peaks.push(sum / windowSize);
                }
                
                const intervals = [];
                let lastPeak = 0;
                const threshold = Math.max(...peaks) * 0.6;
                
                for (let i = 1; i < peaks.length; i++) {
                    if (peaks[i] > threshold && peaks[i] > peaks[i-1] && peaks[i] > peaks[i+1]) {
                        if (lastPeak > 0) {
                            intervals.push((i - lastPeak) * 0.1);
                        }
                        lastPeak = i;
                    }
                }
                
                if (intervals.length === 0) return 120;
                
                const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                const bpm = 60 / avgInterval;
                
                return Math.max(60, Math.min(200, bpm));
            }
            
            generateWaveformData(audioBuffer) {
                const channelData = audioBuffer.getChannelData(0);
                const samples = 200;
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
            console.log('DOM loaded, initializing CDJ App...');
            window.cdjApp = new CDJApp();
        });
        
        // Handle audio context resume on user interaction
        document.addEventListener('click', async () => {
            if (window.cdjApp && window.cdjApp.audioContext && window.cdjApp.audioContext.state === 'suspended') {
                try {
                    await window.cdjApp.audioContext.resume();
                    console.log('Audio context resumed after user interaction');
                } catch (error) {
                    console.error('Failed to resume audio context:', error);
                }
            }
        }, { once: true });
    </script>
</body>
</html>
```