import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";
import type { Song } from "@workspace/api-client-react";

export type RepeatMode = "off" | "all" | "one";

interface PlayerContextType {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  repeatMode: RepeatMode;
  shuffle: boolean;
  play: (song: Song, newQueue?: Song[]) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  setVolume: (vol: number) => void;
  seek: (time: number) => void;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [shuffle, setShuffle] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Refs so event handlers always see latest state
  const currentSongRef = useRef(currentSong);
  const queueRef = useRef(queue);
  const repeatModeRef = useRef(repeatMode);
  const shuffleRef = useRef(shuffle);

  currentSongRef.current = currentSong;
  queueRef.current = queue;
  repeatModeRef.current = repeatMode;
  shuffleRef.current = shuffle;

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => nextRef.current();

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
    };
  }, []);

  const playInternal = useCallback((song: Song) => {
    setCurrentSong(song);
    if (audioRef.current) {
      audioRef.current.src = `/api/songs/${song.id}/stream`;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  }, []);

  const play = useCallback((song: Song, newQueue?: Song[]) => {
    if (newQueue) setQueue(newQueue);
    else setQueue(q => q.find(s => s.id === song.id) ? q : [...q, song]);
    playInternal(song);
  }, [playInternal]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && currentSong) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  }, [currentSong]);

  const next = useCallback(() => {
    const song = currentSongRef.current;
    const q = queueRef.current;
    const repeat = repeatModeRef.current;
    const shuf = shuffleRef.current;
    if (!song || q.length === 0) return;

    if (repeat === "one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
      return;
    }

    const idx = q.findIndex(s => s.id === song.id);

    if (shuf) {
      const others = q.filter(s => s.id !== song.id);
      if (others.length === 0) return;
      const next = others[Math.floor(Math.random() * others.length)];
      playInternal(next);
      return;
    }

    if (idx < q.length - 1) {
      playInternal(q[idx + 1]);
    } else if (repeat === "all") {
      playInternal(q[0]);
    }
    // repeat === "off" → stop at end
  }, [playInternal]);

  const nextRef = useRef(next);
  nextRef.current = next;

  const prev = useCallback(() => {
    const song = currentSongRef.current;
    const q = queueRef.current;
    if (!song) return;
    if (progress > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      return;
    }
    const idx = q.findIndex(s => s.id === song.id);
    if (idx > 0) playInternal(q[idx - 1]);
    else if (repeatModeRef.current === "all") playInternal(q[q.length - 1]);
  }, [progress, playInternal]);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) audioRef.current.volume = vol;
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode(m => m === "off" ? "all" : m === "all" ? "one" : "off");
  }, []);

  const toggleShuffle = useCallback(() => setShuffle(s => !s), []);

  return (
    <PlayerContext.Provider value={{
      currentSong, queue, isPlaying, volume, progress, duration,
      repeatMode, shuffle,
      play, pause, resume, next, prev, setVolume, seek, cycleRepeat, toggleShuffle,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within a PlayerProvider");
  return context;
}
