import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Image, Platform,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Feather } from "@expo/vector-icons";
import { usePlayer, type RepeatMode } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function RepeatIcon({ mode, color, size }: { mode: RepeatMode; color: string; size: number }) {
  if (mode === "one") {
    return <Feather name="repeat" size={size} color={color} />;
  }
  return <Feather name="repeat" size={size} color={color} />;
}

export default function PlayerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    currentSong, isPlaying, position, duration,
    togglePlayPause, seekTo, playNext, playPrev, isLoading,
    repeatMode, shuffle, cycleRepeat, toggleShuffle,
  } = usePlayer();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const onRepeat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cycleRepeat();
  };

  const onShuffle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleShuffle();
  };

  if (!currentSong) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Feather name="headphones" size={64} color={colors.border} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nothing playing</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Library mein jao aur koi song tap karo
        </Text>
      </View>
    );
  }

  const progress = duration > 0 ? position / duration : 0;
  const repeatActive = repeatMode !== "off";
  const repeatLabel = repeatMode === "one" ? "1" : repeatMode === "all" ? "" : "";

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad + 8, paddingBottom: botPad + 80 }]}>
      {/* Artwork */}
      <View style={styles.artworkWrap}>
        {currentSong.thumbnailUrl ? (
          <Image
            source={{ uri: currentSong.thumbnailUrl }}
            style={[styles.artwork, { borderRadius: colors.radius * 2 }]}
          />
        ) : (
          <View style={[styles.artwork, { backgroundColor: colors.secondary, borderRadius: colors.radius * 2, alignItems: "center", justifyContent: "center" }]}>
            <Feather name="music" size={80} color={colors.primary} />
          </View>
        )}
        <View style={[styles.glow, { backgroundColor: colors.primary }]} />
      </View>

      {/* Song info */}
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {currentSong.title}
        </Text>
        <Text style={[styles.artist, { color: colors.mutedForeground }]} numberOfLines={1}>
          {currentSong.artist}
        </Text>
      </View>

      {/* Seek bar */}
      <View style={styles.seekWrap}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          value={progress}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
          onSlidingComplete={(val) => seekTo(val * duration)}
        />
        <View style={styles.timeRow}>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>{formatTime(position)}</Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Main controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); playPrev(); }} style={styles.ctrlBtn}>
          <Feather name="skip-back" size={28} color={colors.foreground} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); togglePlayPause(); }}
          style={[styles.playBtn, { backgroundColor: colors.primary }]}
          disabled={isLoading}
        >
          <Feather name={isPlaying ? "pause" : "play"} size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); playNext(); }} style={styles.ctrlBtn}>
          <Feather name="skip-forward" size={28} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Shuffle + Repeat row */}
      <View style={styles.modesRow}>
        {/* Shuffle */}
        <TouchableOpacity onPress={onShuffle} style={styles.modeBtn}>
          <Feather name="shuffle" size={20} color={shuffle ? colors.primary : colors.mutedForeground} />
          {shuffle && <View style={[styles.modeDot, { backgroundColor: colors.primary }]} />}
        </TouchableOpacity>

        {/* Mode label */}
        <View style={[styles.modeLabel, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
          <Text style={[styles.modeLabelText, { color: shuffle ? colors.primary : colors.mutedForeground }]}>
            {shuffle ? "🔀 Shuffle On" : ""}
          </Text>
          <Text style={[styles.modeLabelText, { color: repeatActive ? colors.primary : colors.mutedForeground }]}>
            {repeatMode === "one" ? "🔂 Ek song repeat" : repeatMode === "all" ? "🔁 Sab repeat" : (!shuffle ? "Normal mode" : "")}
          </Text>
        </View>

        {/* Repeat */}
        <TouchableOpacity onPress={onRepeat} style={styles.modeBtn}>
          <View>
            <Feather name="repeat" size={20} color={repeatActive ? colors.primary : colors.mutedForeground} />
            {repeatMode === "one" && (
              <View style={[styles.repeatOneBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.repeatOneText}>1</Text>
              </View>
            )}
            {repeatMode === "all" && (
              <View style={[styles.modeDot, { backgroundColor: colors.primary }]} />
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center", gap: 24 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32 },
  artworkWrap: { position: "relative", alignItems: "center" },
  artwork: { width: 260, height: 260 },
  glow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.15,
    top: 30,
    zIndex: -1,
  },
  info: { alignItems: "center", width: "100%", gap: 6 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  artist: { fontSize: 16, fontFamily: "Inter_400Regular" },
  seekWrap: { width: "100%", gap: 4 },
  slider: { width: "100%", height: 40 },
  timeRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 },
  time: { fontSize: 12, fontFamily: "Inter_400Regular" },
  controls: { flexDirection: "row", alignItems: "center", gap: 32 },
  ctrlBtn: { padding: 8 },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#9d4edd",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  modesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 8,
    gap: 12,
  },
  modeBtn: { padding: 10, alignItems: "center", justifyContent: "center" },
  modeDot: {
    position: "absolute",
    bottom: -4,
    left: "50%",
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: -2,
  },
  repeatOneBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  repeatOneText: { fontSize: 8, fontFamily: "Inter_700Bold", color: "#fff" },
  modeLabel: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    gap: 2,
  },
  modeLabelText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
});
