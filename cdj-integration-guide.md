# CDJ Integration Guide - Method 2: Extract and Integrate

## Step 1: Add the CSS to your website

Copy this CSS and paste it into your existing CSS file or add it in a `<style>` tag in your HTML head:

```css
/* CDJ Interface Styles */
* {
    box-sizing: border-box;
}

.cdj-container {
    display: flex;
    gap: 20px;
    padding: 20px;
    min-width: 1400px;
    justify-content: center;
    align-items: flex-start;
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    color: white;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.deck {
    background: linear-gradient(145deg, #2a2a2a, #1e1e1e);
    border: 2px solid #444;
    border-radius: 12px;
    padding: 20px;
    width: 600px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.deck-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #444;
}

.deck-title {
    font-size: 18px;
    font-weight: bold;
    color: #00ff9f;
}

.deck-status {
    font-size: 14px;
    color: #00ff9f;
    font-weight: bold;
}

.waveform-container {
    background: #000;
    border: 2px solid #333;
    border-radius: 8px;
    height: 140px;
    margin-bottom: 15px;
    position: relative;
    overflow: hidden;
}

.waveform-canvas {
    width: 100%;
    height: 100%;
    cursor: pointer;
}

.track-info {
    margin-bottom: 15px;
}

.track-name {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.time-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.time-current {
    color: #ff8c00;
    font-family: 'Courier New', monospace;
    font-size: 14px;
}

.bpm-display {
    text-align: center;
}

.bpm-value {
    font-size: 20px;
    font-weight: bold;
    color: #00ccff;
}

.bpm-label {
    font-size: 12px;
    color: #999;
}

.time-remaining {
    color: #ff8c00;
    font-family: 'Courier New', monospace;
    font-size: 14px;
}

.controls {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    justify-content: center;
}

.btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    background: #333;
    color: white;
    border: 1px solid #555;
}

.btn:hover {
    background: #444;
    border-color: #666;
}

.btn.active {
    background: #00ff9f;
    color: #000;
}

.btn-play {
    background: #28a745;
    border-color: #28a745;
}

.btn-play:hover {
    background: #34ce57;
}

.btn-stop {
    background: #dc3545;
    border-color: #dc3545;
}

.btn-stop:hover {
    background: #e74c3c;
}

.btn-load {
    background: #007bff;
    border-color: #007bff;
}

.btn-load:hover {
    background: #0056b3;
}

.eq-section {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-bottom: 15px;
}

.eq-knob {
    text-align: center;
}

.eq-label {
    font-size: 12px;
    color: #999;
    margin-bottom: 5px;
}

.knob {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: radial-gradient(circle, #444, #222);
    border: 2px solid #666;
    position: relative;
    cursor: pointer;
    margin: 0 auto;
}

.knob::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 15px;
    background: #fff;
    border-radius: 1px;
}

.tempo-section {
    text-align: center;
    margin-bottom: 15px;
}

.tempo-label {
    font-size: 12px;
    color: #999;
    margin-bottom: 5px;
}

.tempo-value {
    color: #00ccff;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    margin-bottom: 10px;
}

.tempo-slider {
    width: 200px;
    height: 6px;
    background: #333;
    border-radius: 3px;
    margin: 0 auto;
    position: relative;
    cursor: pointer;
}

.tempo-slider::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 12px;
    height: 12px;
    background: #00ccff;
    border-radius: 50%;
    border: 2px solid #fff;
}

.mixer {
    background: linear-gradient(145deg, #2a2a2a, #1e1e1e);
    border: 2px solid #444;
    border-radius: 12px;
    padding: 20px;
    width: 200px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.mixer-title {
    text-align: center;
    font-size: 16px;
    font-weight: bold;
    color: #00ff9f;
    margin-bottom: 20px;
}

.crossfader-section {
    text-align: center;
    margin-bottom: 20px;
}

.crossfader {
    width: 150px;
    height: 6px;
    background: #333;
    border-radius: 3px;
    margin: 10px auto;
    position: relative;
    cursor: pointer;
}

.crossfader::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    background: #ff6b35;
    border-radius: 50%;
    border: 2px solid #fff;
}

.volume-section {
    margin-bottom: 15px;
}

.volume-label {
    font-size: 12px;
    color: #999;
    text-align: center;
    margin-bottom: 5px;
}

.volume-fader {
    width: 6px;
    height: 100px;
    background: #333;
    border-radius: 3px;
    margin: 0 auto;
    position: relative;
    cursor: pointer;
}

.volume-fader::after {
    content: '';
    position: absolute;
    bottom: 25%;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 12px;
    background: #28a745;
    border-radius: 6px;
    border: 1px solid #fff;
}

.hidden {
    display: none;
}

.loading {
    opacity: 0.6;
    pointer-events: none;
}

.error {
    color: #dc3545;
    font-size: 12px;
    text-align: center;
    margin-top: 5px;
}

@media (max-width: 1440px) {
    .cdj-container {
        flex-direction: column;
        align-items: center;
        min-width: auto;
    }
    
    .deck {
        width: 100%;
        max-width: 600px;
    }
    
    .mixer {
        width: 100%;
        max-width: 300px;
    }
}
```

## Step 2: Add the HTML structure to your page

Add this HTML where you want the CDJ interface to appear:

```html
<div class="cdj-container">
    <!-- Deck A -->
    <div class="deck" data-deck="A">
        <div class="deck-header">
            <div class="deck-title">CDJ-3000</div>
            <div class="deck-status">READY</div>
        </div>
        
        <div class="waveform-container">
            <canvas class="waveform-canvas" width="560" height="140"></canvas>
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
            <div class="eq-label">CROSSFADER</div>
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
        
        <div class="waveform-container">
            <canvas class="waveform-canvas" width="560" height="140"></canvas>
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
```

## Step 3: Add the JavaScript

Add this JavaScript before your closing `</body>` tag or in your existing JavaScript file:

```javascript
class CDJApp {
    // [The complete JavaScript class code from the standalone file]
    // This is the same exact code, just copy it over
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new CDJApp();
});
```

## Example complete integration:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Your Website</title>
    <!-- Your existing CSS -->
    <style>
        /* Add the CDJ CSS here */
    </style>
</head>
<body>
    <!-- Your existing content -->
    <h1>Welcome to my website</h1>
    
    <!-- CDJ Interface -->
    <div class="cdj-container">
        <!-- Add the complete HTML structure here -->
    </div>
    
    <!-- Your existing JavaScript -->
    <script>
        // Add the CDJ JavaScript class here
        // Then initialize it
        document.addEventListener('DOMContentLoaded', () => {
            new CDJApp();
        });
    </script>
</body>
</html>
```

That's it! The CDJ interface will be fully functional on your website.