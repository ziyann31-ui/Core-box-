import React, { createContext, useContext, useRef, useState, useCallback } from "react";
import { Audio } from "expo-av";

export type RepeatMode = "off" | "all" | "one";

export interface Song {
  id: number;
  title: string;
  artist: string;
  thumbnailUrl?: string | null;
  duration?: number | null;
}

interface PlayerContextValue {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  position: number;
  duration: number;
  isLoading: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;
  baseUrl: string;
  playSong: (song: Song, queue?: Song[]) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  playNext: () => void;
  playPrev: () => void;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children, baseUrl }: { children: React.ReactNode; baseUrl: string }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [shuffle, setShuffle] = useState(false);

  // Refs so playback callback never has stale closures
  const currentSongRef = useRef<Song | null>(null);
  const queueRef = useRef<Song[]>([]);
  const repeatModeRef = useRef<RepeatMode>("off");
  const shuffleRef = useRef(false);
  const playNextRef = useRef<() => void>(() => {});

  const unloadSound = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  const playInternal = useCallback(async (song: Song) => {
    setIsLoading(true);
    try {
      await unloadSound();
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const url = `${baseUrl}/api/songs/${song.id}/stream`;
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPosition((status.positionMillis || 0) / 1000);
            setDuration((status.durationMillis || 0) / 1000);
            setIsPlaying(status.isPlaying ?? false);
            // Auto-advance when song ends
            if (status.didJustFinish) {
              playNextRef.current();
            }
          }
        }
      );
      soundRef.current = sound;
      setCurrentSong(song);
      currentSongRef.current = song;
      setIsPlaying(true);
    } catch (e) {
      console.error("Failed to play", e);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  const playSong = useCallback(async (song: Song, newQueue?: Song[]) => {
    if (newQueue) {
      setQueue(newQueue);
      queueRef.current = newQueue;
    }
    await playInternal(song);
  }, [playInternal]);

  const togglePlayPause = useCallback(async () => {
    if (!soundRef.current) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  }, [isPlaying]);

  const seekTo = useCallback(async (seconds: number) => {
    if (!soundRef.current) return;
    await soundRef.current.setPositionAsync(seconds * 1000);
  }, []);

  const playNext = useCallback(() => {
    const song = currentSongRef.current;
    const q = queueRef.current;
    const repeat = repeatModeRef.current;
    const shuf = shuffleRef.current;
    if (!song || q.length === 0) return;

    if (repeat === "one") {
      // Replay same song
      playInternal(song);
      return;
    }

    if (shuf) {
      const others = q.filter(s => s.id !== song.id);
      if (others.length === 0) return;
      const next = others[Math.floor(Math.random() * others.length)];
      playInternal(next);
      return;
    }

    const idx = q.findIndex(s => s.id === song.id);
    if (idx < q.length - 1) {
      playInternal(q[idx + 1]);
    } else if (repeat === "all") {
      playInternal(q[0]);
    }
    // "off" → stop
  }, [playInternal]);

  playNextRef.current = playNext;

  const playPrev = useCallback(() => {
    const song = currentSongRef.current;
    const q = queueRef.current;
    if (!song || q.length === 0) return;

    if (position > 3) {
      // Restart current song
      soundRef.current?.setPositionAsync(0);
      return;
    }

    const idx = q.findIndex(s => s.id === song.id);
    if (idx > 0) {
      playInternal(q[idx - 1]);
    } else if (repeatModeRef.current === "all") {
      playInternal(q[q.length - 1]);
    }
  }, [position, playInternal]);

  const cycleRepeat = useCallback(() => {
    setRepeatMode(m => {
      const next: RepeatMode = m === "off" ? "all" : m === "all" ? "one" : "off";
      repeatModeRef.current = next;
      return next;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle(s => {
      shuffleRef.current = !s;
      return !s;
    });
  }, []);

  return (
    <PlayerContext.Provider value={{
      currentSong, queue, isPlaying, position, duration, isLoading,
      repeatMode, shuffle, baseUrl,
      playSong, togglePlayPause, seekTo, playNext, playPrev, cycleRepeat, toggleShuffle,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}