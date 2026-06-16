import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, TextInput, ActivityIndicator, Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useListSongs } from "@workspace/api-client-react";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const { playSong, currentSong, isPlaying } = usePlayer();

  const { data: songs, isLoading } = useListSongs({ params: search ? { search } : undefined });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handlePlay = (idx: number) => {
    if (!songs) return;
    const song = songs[idx];
    playSong(song as any, songs as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Library</Text>
        <View style={[styles.searchBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search songs..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !songs || songs.length === 0 ? (
        <View style={styles.center}>
          <Feather name="music" size={48} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No songs yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Go to Downloads to add music
          </Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 140 }}
          scrollEnabled={songs.length > 0}
          renderItem={({ item, index }) => {
            const isActive = currentSong?.id === item.id;
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handlePlay(index)}
                style={[styles.songRow, { borderBottomColor: colors.border }]}
              >
                <View style={[styles.thumbWrap, { backgroundColor: colors.secondary, borderRadius: colors.radius / 2 }]}>
                  {item.thumbnailUrl ? (
                    <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
                  ) : (
                    <Feather name="music" size={20} color={colors.mutedForeground} />
                  )}
                  {isActive && (
                    <View style={[styles.playOverlay, { backgroundColor: colors.primary + "cc" }]}>
                      <Feather name={isPlaying ? "pause" : "play"} size={16} color="#fff" />
                    </View>
                  )}
                </View>

                <View style={styles.songInfo}>
                  <Text
                    style={[styles.songTitle, { color: isActive ? colors.primary : colors.foreground }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={[styles.songArtist, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {item.artist}
                  </Text>
                </View>

                <Text style={[styles.duration, { color: colors.mutedForeground }]}>
                  {formatDuration(item.duration)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  thumbWrap: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  songInfo: { flex: 1 },
  songTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  songArtist: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  duration: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
