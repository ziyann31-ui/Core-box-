import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const downloadJobsTable = pgTable("download_jobs", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  status: text("status").notNull().default("pending"),
  progress: integer("progress"),
  error: text("error"),
  songId: integer("song_id"),
  title: text("title"),
  artist: text("artist"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDownloadJobSchema = createInsertSchema(downloadJobsTable).omit({ id: true, createdAt: true });
export type InsertDownloadJob = z.infer<typeof insertDownloadJobSchema>;
export type DownloadJob = typeof downloadJobsTable.$inferSelect;
