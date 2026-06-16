import { Router } from "express";
import { db } from "@workspace/db";
import { songsTable } from "@workspace/db";
import { eq, ilike, or, sql } from "drizzle-orm";
import { ListSongsQueryParams } from "@workspace/api-zod";
import path from "path";
import fs from "fs";

const router = Router();

const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || "/home/runner/workspace/downloads";

router.get("/songs", async (req, res) => {
  try {
    const query = ListSongsQueryParams.safeParse(req.query);
    const search = query.success ? query.data.search : undefined;
    const playlistId = query.success ? query.data.playlistId : undefined;

    let songs;

    if (playlistId) {
      songs = await db.execute(sql`
        SELECT s.* FROM songs s
        INNER JOIN playlist_songs ps ON ps.song_id = s.id
        WHERE ps.playlist_id = ${playlistId}
        ORDER BY ps.position ASC
      `);
      res.json(songs.rows.map(mapSong));
      return;
    }

    if (search) {
      songs = await db.select().from(songsTable)
        .where(or(
          ilike(songsTable.title, `%${search}%`),
          ilike(songsTable.artist, `%${search}%`),
          ilike(songsTable.album, `%${search}%`)
        ))
        .orderBy(songsTable.downloadedAt);
    } else {
      songs = await db.select().from(songsTable).orderBy(songsTable.downloadedAt);
    }

    res.json(songs.map(mapSong));
  } catch (err) {
    req.log.error({ err }, "Failed to list songs");
    res.status(500).json({ error: "Failed to list songs" });
  }
});

router.get("/songs/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [song] = await db.select().from(songsTable).where(eq(songsTable.id, id));
    if (!song) {
      res.status(404).json({ error: "Song not found" });
      return;
    }
    res.json(mapSong(song));
  } catch (err) {
    req.log.error({ err }, "Failed to get song");
    res.status(500).json({ error: "Failed to get song" });
  }
});

router.get("/songs/:id/stream", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [song] = await db.select().from(songsTable).where(eq(songsTable.id, id));
    if (!song) {
      res.status(404).json({ error: "Song not found" });
      return;
    }

    const filePath = song.filePath;
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Audio file not found on disk" });
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "audio/mpeg",
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "audio/mpeg",
        "Accept-Ranges": "bytes",
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    req.log.error({ err }, "Failed to stream song");
    res.status(500).json({ error: "Failed to stream song" });
  }
});

router.delete("/songs/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [song] = await db.select().from(songsTable).where(eq(songsTable.id, id));
    if (!song) {
      res.status(404).json({ error: "Song not found" });
      return;
    }
    if (fs.existsSync(song.filePath)) {
      fs.unlinkSync(song.filePath);
    }
    await db.delete(songsTable).where(eq(songsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete song");
    res.status(500).json({ error: "Failed to delete song" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const totalSongsResult = await db.execute(sql`SELECT COUNT(*) as count FROM songs`);
    const totalPlaylistsResult = await db.execute(sql`SELECT COUNT(*) as count FROM playlists`);
    const totalDownloadedResult = await db.execute(sql`SELECT COUNT(*) as count FROM download_jobs WHERE status = 'done'`);
    const activeDownloadsResult = await db.execute(sql`SELECT COUNT(*) as count FROM download_jobs WHERE status IN ('pending','downloading')`);
    const sizeResult = await db.execute(sql`SELECT COALESCE(SUM(file_size), 0) as total FROM songs`);

    res.json({
      totalSongs: parseInt(String((totalSongsResult.rows[0] as any)?.count || 0)),
      totalPlaylists: parseInt(String((totalPlaylistsResult.rows[0] as any)?.count || 0)),
      totalDownloaded: parseInt(String((totalDownloadedResult.rows[0] as any)?.count || 0)),
      activeDownloads: parseInt(String((activeDownloadsResult.rows[0] as any)?.count || 0)),
      totalSizeMb: parseFloat(String((sizeResult.rows[0] as any)?.total || 0)) / (1024 * 1024),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

function mapSong(s: Record<string, unknown>) {
  return {
    id: s.id,
    title: s.title,
    artist: s.artist,
    album: s.album ?? null,
    duration: s.duration ?? null,
    filePath: s.file_path ?? s.filePath,
    thumbnailUrl: s.thumbnail_url ?? s.thumbnailUrl ?? null,
    fileSize: s.file_size ?? s.fileSize ?? null,
    downloadedAt: s.downloaded_at ?? s.downloadedAt,
  };
}

export default router;
