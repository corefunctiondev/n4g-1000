import React from 'react';

interface BuildingBlocksProps {
  text?: string;
  className?: string;
}

export function BuildingBlocks({ text = "Under Development...", className = "" }: BuildingBlocksProps) {
  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Animated building blocks */}
      <div className="flex space-x-1">
        <div className="building-block building-block-1 w-4 h-4 bg-cyan-400 rounded"></div>
        <div className="building-block building-block-2 w-4 h-4 bg-orange-400 rounded"></div>
        <div className="building-block building-block-3 w-4 h-4 bg-green-400 rounded"></div>
        <div className="building-block building-block-4 w-4 h-4 bg-purple-400 rounded"></div>
        <div className="building-block building-block-5 w-4 h-4 bg-yellow-400 rounded"></div>
      </div>
      
      {/* Text */}
      <div className="text-cyan-400 font-bold text-lg animate-pulse">
        {text}
      </div>
      
      {/* Progress dots */}
      <div className="flex space-x-1">
        <div className="progress-dot progress-dot-1 w-2 h-2 bg-gray-400 rounded-full"></div>
        <div className="progress-dot progress-dot-2 w-2 h-2 bg-gray-400 rounded-full"></div>
        <div className="progress-dot progress-dot-3 w-2 h-2 bg-gray-400 rounded-full"></div>
      </div>
    </div>
  );
}

// Add the CSS animations to the global styles
const buildingBlocksCSS = `
@keyframes buildingBlockFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(5deg); }
  50% { transform: translateY(-4px) rotate(-3deg); }
  75% { transform: translateY(-12px) rotate(2deg); }
}

@keyframes progressDotPulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

.building-block {
  animation: buildingBlockFloat 2s ease-in-out infinite;
}

.building-block-1 { animation-delay: 0s; }
.building-block-2 { animation-delay: 0.2s; }
.building-block-3 { animation-delay: 0.4s; }
.building-block-4 { animation-delay: 0.6s; }
.building-block-5 { animation-delay: 0.8s; }

.progress-dot {
  animation: progressDotPulse 1.5s ease-in-out infinite;
}

.progress-dot-1 { animation-delay: 0s; }
.progress-dot-2 { animation-delay: 0.5s; }
.progress-dot-3 { animation-delay: 1s; }
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = buildingBlocksCSS;
  document.head.appendChild(styleElement);
}