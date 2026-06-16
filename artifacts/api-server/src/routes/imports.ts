import { Router } from "express";
import multer from "multer";
import { db } from "@workspace/db";
import { downloadJobsTable } from "@workspace/db";
import { startDownload } from "../lib/downloader";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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
    const artist = artistIdx !== -1 ? row[artistIdx]?.trim() || "Unknown Artist" : "Unknown Artist";
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
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

router.post("/imports/spotify-csv", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const csvText = req.file.buffer.toString("utf-8");
    const songs = parseExportifyCsv(csvText);

    if (songs.length === 0) {
      res.status(400).json({ error: "No songs found in CSV. Make sure it's an Exportify CSV with Track Name and Artist Name columns." });
      return;
    }

    const queued: number[] = [];

    for (const song of songs) {
      const searchQuery = `${song.title} ${song.artist}`;
      const [job] = await db.insert(downloadJobsTable).values({
        query: searchQuery,
        status: "pending",
        title: song.title,
        artist: song.artist,
      }).returning();
      queued.push(job.id);
      startDownload(job.id).catch(() => {});
    }

    res.status(201).json({
      queued: queued.length,
      message: `${queued.length} songs queued for download`,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to import CSV");
    res.status(500).json({ error: "Failed to import CSV" });
  }
});

export default router;
