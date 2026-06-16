import { pgTable, serial, text, integer, timestamp, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const songsTable = pgTable("songs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  duration: integer("duration"),
  filePath: text("file_path").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  fileSize: bigint("file_size", { mode: "number" }),
  downloadedAt: timestamp("downloaded_at").notNull().defaultNow(),
});

export const insertSongSchema = createInsertSchema(songsTable).omit({ id: true, downloadedAt: true });
export type InsertSong = z.infer<typeof insertSongSchema>;
export type Song = typeof songsTable.$inferSelect;
