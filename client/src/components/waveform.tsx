import { useWaveform } from '@/hooks/use-waveform';
import { AudioTrack } from '@/types/audio';

interface WaveformProps {
  track: AudioTrack | null;
  currentTime: number;
  width: number;
  height: number;
  color: string;
  onSeek?: (time: number) => void;
  className?: string;
}

export function Waveform({
  track,
  currentTime,
  width,
  height,
  color,
  onSeek,
  className = '',
}: WaveformProps) {
  const { canvasRef, handleCanvasClick } = useWaveform(track, {
    width,
    height,
    color,
    backgroundColor: '#0a0a0a',
    currentTime,
    duration: track?.duration || 0,
  });

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const seekTime = handleCanvasClick(event.nativeEvent);
    if (seekTime !== undefined && onSeek) {
      onSeek(seekTime);
    }
  };

  return (
    <div className={`cdj-waveform rounded-lg overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="w-full h-full cursor-pointer"
        style={{ width, height }}
      />
    </div>
  );
}
