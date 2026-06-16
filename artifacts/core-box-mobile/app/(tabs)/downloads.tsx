import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useListDownloads, useCreateDownload, useCancelDownload } from "@workspace/api-client-react";
import { getListDownloadsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { usePlayer } from "@/context/PlayerContext";

type Mode = "single" | "batch";

function parseExportifyCsv(csv: string): Array<{ title: string; artist: string }> {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = parseCsvRow(lines[0]);
  const trackIdx = header.findIndex(h => h.toLowerCase().includes("track name") || h.toLowerCase() === "name");
  const artistIdx = header.findIndex(h => h.toLowerCase().includes("artist name") || h.toLowerCase() === "artists");
  if (trackIdx === -1) return [];
  const songs: Array<{ title: string; artist: string }> = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvRow(lines[i]);
    const title = row[trackIdx]?.trim();
    if (!title) continue;
    const artist = artistIdx !== -1 ? row[artistIdx]?.trim() || "" : "";
    songs.push({ title, artist });
  }
  return songs;
}

function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) { result.push(cur); cur = ""; }
    else cur += ch;
  }
  result.push(cur);
  return result;
}

export default function DownloadsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("single");
  const [query, setQuery] = useState("");
  const [batchText, setBatchText] = useState("");
  const [csvImporting, setCsvImporting] = useState(false);
  const queryClient = useQueryClient();
  const { baseUrl } = usePlayer();

  const { data: downloads } = useListDownloads({ query: { refetchInterval: 2000 } });
  const createDownload = useCreateDownload();
  const cancelDownload = useCancelDownload();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListDownloadsQueryKey() });

  const handleSingle = () => {
    if (!query.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    createDownload.mutate({ data: { query: query.trim() } }, {
      onSuccess: () => { setQuery(""); invalidate(); }
    });
  };

  const handleBatch = () => {
    const list = batchText.split("\n").map(l => l.trim()).filter(Boolean);
    if (list.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createDownload.mutate({ data: { queries: list } }, {
      onSuccess: () => { setBatchText(""); invalidate(); }
    });
  };

  const handleCsvImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "text/comma-separated-values", copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setCsvImporting(true);

      let csvText = "";
      if (Platform.OS === "web") {
        const response = await fetch(asset.uri);
        csvText = await response.text();
        const songs = parseExportifyCsv(csvText);
        if (songs.length === 0) {
          Alert.alert("Error", "No songs found in CSV. Make sure it's from Exportify.");
          return;
        }
        const queries = songs.map(s => s.artist ? `${s.title} ${s.artist}` : s.title);
        createDownload.mutate({ data: { queries } }, {
          onSuccess: () => { invalidate(); Alert.alert("Imported!", `${songs.length} songs queued!`); }
        });
      } else {
        const response = await fetch(asset.uri);
        csvText = await response.text();
        const songs = parseExportifyCsv(csvText);
        if (songs.length === 0) {
          Alert.alert("Error", "No songs found in CSV. Make sure it's from Exportify.");
          return;
        }
        const formData = new FormData();
        formData.append("file", { uri: asset.uri, name: "liked.csv", type: "text/csv" } as any);
        const res = await fetch(`${baseUrl}/api/imports/spotify-csv`, { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Import failed");
        invalidate();
        Alert.alert("Import Done!", `${data.queued} songs queued for download!`);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Import failed");
    } finally {
      setCsvImporting(false);
    }
  };

  const statusColor = (status: string) => {
    if (status === "done") return "#22c55e";
    if (status === "failed") return colors.destructive;
    if (status === "downloading") return colors.primary;
    return colors.mutedForeground;
  };

  const statusIcon = (status: string): React.ComponentProps<typeof Feather>["name"] => {
    if (status === "done") return "check-circle";
    if (status === "failed") return "alert-circle";
    if (status === "downloading") return "download";
    return "clock";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Downloads</Text>

        {/* Mode tabs */}
        <View style={[styles.tabRow, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
          {(["single", "batch"] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              style={[
                styles.tabBtn,
                { borderRadius: colors.radius - 2 },
                mode === m && { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[styles.tabLabel, { color: mode === m ? "#fff" : colors.mutedForeground }]}>
                {m === "single" ? "Single" : "Batch"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input */}
        {mode === "single" ? (
          <View style={[styles.inputRow]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border, borderRadius: colors.radius, flex: 1 }]}
              placeholder="Song name..."
              placeholderTextColor={colors.mutedForeground}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSingle}
              returnKeyType="search"
            />
            <TouchableOpacity
              onPress={handleSingle}
              disabled={!query.trim() || createDownload.isPending}
              style={[styles.downloadBtn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: !query.trim() ? 0.5 : 1 }]}
            >
              {createDownload.isPending
                ? <ActivityIndicator color="#fff" size="small" />
                : <Feather name="download" size={20} color="#fff" />}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <TextInput
              style={[styles.textarea, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border, borderRadius: colors.radius }]}
              placeholder={"Tum Hi Ho Arijit\nShayad Arijit Singh\n..."}
              placeholderTextColor={colors.mutedForeground}
              value={batchText}
              onChangeText={setBatchText}
              multiline
              numberOfLines={4}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={handleCsvImport}
                disabled={csvImporting}
                style={[styles.csvBtn, { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: colors.radius }]}
              >
                {csvImporting
                  ? <ActivityIndicator color={colors.primary} size="small" />
                  : <><Feather name="file-text" size={16} color={colors.primary} /><Text style={[styles.csvBtnText, { color: colors.primary }]}>Spotify CSV</Text></>
                }
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBatch}
                disabled={!batchText.trim() || createDownload.isPending}
                style={[styles.batchBtn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: !batchText.trim() ? 0.5 : 1 }]}
              >
                {createDownload.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Feather name="list" size={16} color="#fff" /><Text style={styles.batchBtnText}>Download All</Text></>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Download list */}
      <FlatList
        data={downloads || []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 8 }}
        scrollEnabled={!!(downloads && downloads.length > 0)}
        ListEmptyComponent={
          <View style={styles.center}>
            <Feather name="download-cloud" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No downloads yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.jobRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <View style={[styles.jobIcon, { backgroundColor: colors.secondary }]}>
              <Feather name={statusIcon(item.status)} size={18} color={statusColor(item.status)} />
            </View>
            <View style={styles.jobInfo}>
              <Text style={[styles.jobTitle, { color: colors.foreground }]} numberOfLines={1}>
                {item.title || item.query}
              </Text>
              <Text style={[styles.jobStatus, { color: statusColor(item.status) }]}>
                {item.status === "downloading" ? `${Math.round(item.progress || 0)}%` : item.status}
              </Text>
            </View>
            {item.status !== "done" && (
              <TouchableOpacity onPress={() => cancelDownload.mutate({ id: item.id }, { onSuccess: invalidate })}>
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  tabRow: { flexDirection: "row", padding: 3, gap: 2 },
  tabBtn: { flex: 1, paddingVertical: 7, alignItems: "center" },
  tabLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  inputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: { paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1, fontFamily: "Inter_400Regular" },
  downloadBtn: { width: 46, height: 46, alignItems: "center", justifyContent: "center" },
  textarea: { paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 1, minHeight: 90, textAlignVertical: "top", fontFamily: "Inter_400Regular" },
  csvBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1 },
  csvBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  batchBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 },
  batchBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  jobRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 12, marginVertical: 4, padding: 12, gap: 10, borderWidth: 1 },
  jobIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  jobInfo: { flex: 1 },
  jobTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  jobStatus: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, textTransform: "capitalize" },
});