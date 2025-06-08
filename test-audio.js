// Quick audio functionality test
console.log('Testing audio functionality...');

// Test 1: Audio Engine Initialization
try {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  console.log('✓ Audio Context created successfully');
  console.log('Sample Rate:', context.sampleRate);
  console.log('State:', context.state);
} catch (error) {
  console.error('✗ Audio Context failed:', error);
}

// Test 2: File API Support
if (window.File && window.FileReader && window.FileList && window.Blob) {
  console.log('✓ File API supported');
} else {
  console.error('✗ File API not supported');
}

// Test 3: Web Audio API Features
const features = [
  'AudioContext',
  'GainNode', 
  'BiquadFilterNode',
  'AnalyserNode',
  'AudioBufferSourceNode',
  'DynamicsCompressorNode'
];

features.forEach(feature => {
  if (window[feature] || window.webkitAudioContext) {
    console.log(`✓ ${feature} supported`);
  } else {
    console.error(`✗ ${feature} not supported`);
  }
});

console.log('Audio test complete');