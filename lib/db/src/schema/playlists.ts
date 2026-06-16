import { pgTable, serial, text, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playlistsTable = pgTable("playlists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const playlistSongsTable = pgTable("playlist_songs", {
  playlistId: integer("playlist_id").notNull(),
  songId: integer("song_id").notNull(),
  position: integer("position").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.playlistId, t.songId] })]);

export const insertPlaylistSchema = createInsertSchema(playlistsTable).omit({ id: true, createdAt: true });
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlistsTable.$inferSelect;
export type PlaylistSong = typeof playlistSongsTable.$inferSelect;
