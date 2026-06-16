import { Router } from "express";
import { db } from "@workspace/db";
import { playlistsTable, playlistSongsTable, songsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/playlists", async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT p.*, COUNT(ps.song_id) as song_count
      FROM playlists p
      LEFT JOIN playlist_songs ps ON ps.playlist_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows.map((p: any) => ({
      id: p.id,
      name: p.name,
      songCount: parseInt(p.song_count || "0"),
      createdAt: p.created_at,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list playlists");
    res.status(500).json({ error: "Failed to list playlists" });
  }
});

router.post("/playlists", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: "Name is required" });
      return;
    }
    const [playlist] = await db.insert(playlistsTable).values({ name: name.trim() }).returning();
    res.status(201).json({
      id: playlist.id,
      name: playlist.name,
      songCount: 0,
      createdAt: playlist.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create playlist");
    res.status(500).json({ error: "Failed to create playlist" });
  }
});

router.get("/playlists/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [playlist] = await db.select().from(playlistsTable).where(eq(playlistsTable.id, id));
    if (!playlist) {
      res.status(404).json({ error: "Playlist not found" });
      return;
    }
    const songs = await db.execute(sql`
      SELECT s.* FROM songs s
      INNER JOIN playlist_songs ps ON ps.song_id = s.id
      WHERE ps.playlist_id = ${id}
      ORDER BY ps.position ASC
    `);
    res.json({
      id: playlist.id,
      name: playlist.name,
      createdAt: playlist.createdAt,
      songs: songs.rows.map((s: any) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        album: s.album ?? null,
        duration: s.duration ?? null,
        filePath: s.file_path,
        thumbnailUrl: s.thumbnail_url ?? null,
        fileSize: s.file_size ?? null,
        downloadedAt: s.downloaded_at,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get playlist");
    res.status(500).json({ error: "Failed to get playlist" });
  }
});

router.delete("/playlists/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    await db.delete(playlistSongsTable).where(eq(playlistSongsTable.playlistId, id));
    await db.delete(playlistsTable).where(eq(playlistsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete playlist");
    res.status(500).json({ error: "Failed to delete playlist" });
  }
});

router.post("/playlists/:id/songs", async (req, res) => {
  try {
    const playlistId = parseInt(req.params.id);
    const { songId } = req.body;
    if (isNaN(playlistId) || !songId) {
      res.status(400).json({ error: "Invalid playlist or song id" });
      return;
    }
    const [maxPos] = await db.execute(sql`
      SELECT COALESCE(MAX(position), -1) as max_pos FROM playlist_songs WHERE playlist_id = ${playlistId}
    `);
    const nextPos = parseInt(String((maxPos as any).max_pos)) + 1;
    await db.insert(playlistSongsTable).values({
      playlistId,
      songId,
      position: nextPos,
    }).onConflictDoNothing();
    res.status(201).json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to add song to playlist");
    res.status(500).json({ error: "Failed to add song to playlist" });
  }
});

router.delete("/playlists/:id/songs/:songId", async (req, res) => {
  try {
    const playlistId = parseInt(req.params.id);
    const songId = parseInt(req.params.songId);
    if (isNaN(playlistId) || isNaN(songId)) {
      res.status(400).json({ error: "Invalid ids" });
      return;
    }
    await db.delete(playlistSongsTable).where(
      sql`playlist_id = ${playlistId} AND song_id = ${songId}`
    );
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to remove song from playlist");
    res.status(500).json({ error: "Failed to remove song from playlist" });
  }
});

export default router;
