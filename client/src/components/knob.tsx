import React, { useState, useCallback, useRef } from 'react';

interface KnobProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Knob({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  size = 'md',
  className = '',
}: KnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number>(0);
  const startValueRef = useRef<number>(value);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const normalizedValue = (value - min) / (max - min);
  const rotation = (normalizedValue * 300) - 150; // -150 to +150 degrees

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(true);
    startYRef.current = event.clientY;
    startValueRef.current = value;
  }, [value]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging) return;

    const deltaY = startYRef.current - event.clientY;
    const sensitivity = (max - min) / 100;
    const newValue = startValueRef.current + (deltaY * sensitivity);
    const clampedValue = Math.max(min, Math.min(max, newValue));
    const steppedValue = Math.round(clampedValue / step) * step;

    onChange(steppedValue);
  }, [isDragging, min, max, step, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`relative rounded-full cursor-pointer select-none bg-gray-700 border-2 border-gray-500 shadow-inner ${sizeClasses[size]} ${className} ${isDragging ? 'ring-2 ring-blue-400' : ''}`}
      onMouseDown={handleMouseDown}
      title={`${value}`}
    >
      {/* Knob indicator */}
      <div
        className="absolute w-1 h-3 bg-white rounded-sm shadow-sm"
        style={{
          top: '2px',
          left: '50%',
          transformOrigin: `50% ${(parseInt(sizeClasses[size].split(' ')[0].replace('w-', '')) * 4) / 2 - 2}px`,
          transform: `translateX(-50%) rotate(${rotation}deg)`,
        }}
      />
      
      {/* Center dot */}
      <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-gray-400 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
}
