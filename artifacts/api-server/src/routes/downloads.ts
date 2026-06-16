import { Router } from "express";
import { db } from "@workspace/db";
import { downloadJobsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { startDownload } from "../lib/downloader";

const router = Router();

router.get("/downloads", async (req, res) => {
  try {
    const jobs = await db.select().from(downloadJobsTable)
      .orderBy(downloadJobsTable.createdAt);
    res.json(jobs.map(mapJob));
  } catch (err) {
    req.log.error({ err }, "Failed to list downloads");
    res.status(500).json({ error: "Failed to list downloads" });
  }
});

router.post("/downloads", async (req, res) => {
  try {
    const { query, queries } = req.body;

    const allQueries: string[] = [];
    if (query?.trim()) allQueries.push(query.trim());
    if (Array.isArray(queries)) {
      queries.forEach((q: string) => { if (q?.trim()) allQueries.push(q.trim()); });
    }

    if (allQueries.length === 0) {
      res.status(400).json({ error: "At least one query is required" });
      return;
    }

    const firstJobId = { id: 0 };
    const createdJobs = [];

    for (const q of allQueries) {
      const [job] = await db.insert(downloadJobsTable).values({
        query: q,
        status: "pending",
      }).returning();
      createdJobs.push(job);
      if (firstJobId.id === 0) firstJobId.id = job.id;

      startDownload(job.id).catch(() => {});
    }

    res.status(201).json(mapJob(createdJobs[0]));
  } catch (err) {
    req.log.error({ err }, "Failed to create download");
    res.status(500).json({ error: "Failed to create download" });
  }
});

router.get("/downloads/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [job] = await db.select().from(downloadJobsTable).where(eq(downloadJobsTable.id, id));
    if (!job) {
      res.status(404).json({ error: "Download job not found" });
      return;
    }
    res.json(mapJob(job));
  } catch (err) {
    req.log.error({ err }, "Failed to get download job");
    res.status(500).json({ error: "Failed to get download" });
  }
});

router.delete("/downloads/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    await db.delete(downloadJobsTable).where(eq(downloadJobsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to cancel download");
    res.status(500).json({ error: "Failed to cancel download" });
  }
});

function mapJob(job: any) {
  return {
    id: job.id,
    query: job.query,
    status: job.status,
    progress: job.progress ?? null,
    error: job.error ?? null,
    songId: job.songId ?? job.song_id ?? null,
    title: job.title ?? null,
    artist: job.artist ?? null,
    thumbnailUrl: job.thumbnailUrl ?? job.thumbnail_url ?? null,
    createdAt: job.createdAt ?? job.created_at,
  };
}

export default router;
