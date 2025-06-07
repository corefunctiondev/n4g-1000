import { useState, useCallback, useRef } from 'react';

interface FaderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  orientation?: 'horizontal' | 'vertical';
  length?: number;
  thickness?: number;
  className?: string;
}

export function Fader({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  orientation = 'vertical',
  length = 160,
  thickness = 32,
  className = '',
}: FaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const normalizedValue = (value - min) / (max - min);
  
  const trackStyle = orientation === 'vertical' 
    ? { width: thickness, height: length }
    : { width: length, height: thickness };

  const handlePosition = orientation === 'vertical'
    ? `${(1 - normalizedValue) * (length - 24)}px`
    : `${normalizedValue * (length - 24)}px`;

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(true);
    updateValue(event);
  }, []);

  const updateValue = useCallback((event: React.MouseEvent | MouseEvent) => {
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const position = orientation === 'vertical' 
      ? (rect.bottom - event.clientY) / rect.height
      : (event.clientX - rect.left) / rect.width;
    
    const clampedPosition = Math.max(0, Math.min(1, position));
    const newValue = min + (clampedPosition * (max - min));
    const steppedValue = Math.round(newValue / step) * step;
    
    onChange(steppedValue);
  }, [min, max, step, orientation, onChange]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (isDragging) {
      updateValue(event);
    }
  }, [isDragging, updateValue]);

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
    <div className={`relative ${className}`}>
      <div
        ref={trackRef}
        className="cdj-fader-track rounded-full relative cursor-pointer"
        style={trackStyle}
        onMouseDown={handleMouseDown}
      >
        <div
          className="cdj-fader-handle absolute rounded-full cursor-pointer"
          style={{
            width: orientation === 'vertical' ? thickness + 8 : 24,
            height: orientation === 'vertical' ? 24 : thickness + 8,
            left: orientation === 'vertical' ? -4 : handlePosition,
            top: orientation === 'vertical' ? handlePosition : -4,
          }}
        />
      </div>
    </div>
  );
}
