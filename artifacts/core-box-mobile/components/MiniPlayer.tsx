import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export function MiniPlayer() {
  const { currentSong, isPlaying, togglePlayPause, playNext } = usePlayer();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  if (!currentSong) return null;

  const tabBarHeight = Platform.OS === "web" ? 84 : 50 + insets.bottom;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push("/(tabs)/player")}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          bottom: tabBarHeight,
        },
      ]}
    >
      <View style={styles.inner}>
        {currentSong.thumbnailUrl ? (
          <Image source={{ uri: currentSong.thumbnailUrl }} style={[styles.thumb, { borderRadius: colors.radius / 2 }]} />
        ) : (
          <View style={[styles.thumb, { backgroundColor: colors.secondary, borderRadius: colors.radius / 2, alignItems: "center", justifyContent: "center" }]}>
            <Feather name="music" size={18} color={colors.primary} />
          </View>
        )}

        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {currentSong.title}
          </Text>
          <Text style={[styles.artist, { color: colors.mutedForeground }]} numberOfLines={1}>
            {currentSong.artist}
          </Text>
        </View>

        <TouchableOpacity onPress={togglePlayPause} style={styles.btn}>
          <Feather name={isPlaying ? "pause" : "play"} size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={playNext} style={styles.btn}>
          <Feather name="skip-forward" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 8,
    right: 8,
    borderWidth: 1,
    borderRadius: 16,
    shadowColor: "#9d4edd",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  thumb: {
    width: 42,
    height: 42,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  artist: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  btn: {
    padding: 6,
  },
});