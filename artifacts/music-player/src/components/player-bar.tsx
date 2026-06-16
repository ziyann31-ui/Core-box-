import { Slider } from "./ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music, Shuffle, Repeat, Repeat1 } from "lucide-react";
import { usePlayer } from "@/hooks/use-player";
import { useState, useEffect } from "react";

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlayerBar() {
  const {
    currentSong, isPlaying, progress, duration, volume,
    pause, resume, next, prev, setVolume, seek,
    repeatMode, shuffle, cycleRepeat, toggleShuffle,
  } = usePlayer();
  const [localProgress, setLocalProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) setLocalProgress(progress);
  }, [progress, isDragging]);

  if (!currentSong) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-20 md:h-24 bg-card/95 backdrop-blur-md border-t border-border flex items-center px-4 md:px-8 z-30 justify-between opacity-80">
        <div className="flex items-center gap-4 w-1/3">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-muted rounded-md flex items-center justify-center">
            <Music className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <div className="w-24 h-4 bg-muted rounded mb-2" />
            <div className="w-16 h-3 bg-muted rounded" />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center max-w-xl px-4">
          <div className="flex items-center gap-6 mb-2 text-muted-foreground">
            <SkipBack className="w-5 h-5 opacity-50" />
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Play className="w-4 h-4 ml-1 opacity-50" />
            </div>
            <SkipForward className="w-5 h-5 opacity-50" />
          </div>
          <div className="w-full h-1 bg-muted rounded-full" />
        </div>
        <div className="w-1/3 flex justify-end">
          <Volume2 className="w-5 h-5 text-muted-foreground opacity-50" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 md:h-24 bg-card/95 backdrop-blur-md border-t border-border flex items-center px-4 md:px-8 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
      {/* Song Info */}
      <div className="flex items-center gap-3 md:gap-4 w-1/3 min-w-0">
        <div className="w-12 h-12 md:w-14 md:h-14 bg-muted rounded-md overflow-hidden flex-shrink-0">
          {currentSong.thumbnailUrl ? (
            <img src={currentSong.thumbnailUrl} alt={currentSong.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <Music className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0 overflow-hidden">
          <h4 className="text-sm md:text-base font-semibold text-foreground truncate">{currentSong.title}</h4>
          <p className="text-xs md:text-sm text-muted-foreground truncate">{currentSong.artist}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col items-center max-w-xl px-2 md:px-4">
        <div className="flex items-center gap-3 md:gap-5 mb-1 md:mb-2">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            title="Shuffle"
            className={`transition-colors p-1.5 rounded-md ${shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button onClick={prev} className="text-muted-foreground hover:text-foreground transition-colors p-2">
            <SkipBack className="w-4 h-4 md:w-5 md:h-5 fill-current" />
          </button>

          <button
            onClick={isPlaying ? pause : resume}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:scale-105 hover:shadow-[0_0_15px_rgba(157,78,221,0.5)] transition-all"
          >
            {isPlaying
              ? <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current" />
              : <Play className="w-4 h-4 md:w-5 md:h-5 fill-current ml-1" />}
          </button>

          <button onClick={next} className="text-muted-foreground hover:text-foreground transition-colors p-2">
            <SkipForward className="w-4 h-4 md:w-5 md:h-5 fill-current" />
          </button>

          {/* Repeat */}
          <button
            onClick={cycleRepeat}
            title={repeatMode === "off" ? "Repeat off" : repeatMode === "all" ? "Repeat all" : "Repeat one"}
            className={`transition-colors p-1.5 rounded-md relative ${repeatMode !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {repeatMode === "one"
              ? <Repeat1 className="w-4 h-4" />
              : <Repeat className="w-4 h-4" />}
            {repeatMode === "all" && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full" />
            )}
          </button>
        </div>

        <div className="w-full flex items-center gap-2 md:gap-3 text-[10px] md:text-xs text-muted-foreground font-mono">
          <span>{formatTime(localProgress)}</span>
          <Slider
            value={[localProgress]}
            max={duration || 100}
            step={1}
            onValueChange={(v) => { setIsDragging(true); setLocalProgress(v[0]); }}
            onPointerUp={() => { seek(localProgress); setIsDragging(false); }}
            className="flex-1 cursor-pointer"
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume (desktop only) */}
      <div className="w-1/3 justify-end items-center gap-2 hidden md:flex">
        <button onClick={() => setVolume(volume === 0 ? 1 : 0)} className="text-muted-foreground hover:text-foreground transition-colors">
          {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <div className="w-24">
          <Slider value={[volume * 100]} max={100} step={1} onValueChange={(v) => setVolume(v[0] / 100)} />
        </div>
      </div>
    </div>
  );
}
