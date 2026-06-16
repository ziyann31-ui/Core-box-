import { Router, type IRouter } from "express";
import healthRouter from "./health";
import songsRouter from "./songs";
import downloadsRouter from "./downloads";
import playlistsRouter from "./playlists";
import importsRouter from "./imports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(songsRouter);
router.use(downloadsRouter);
router.use(playlistsRouter);
router.use(importsRouter);

export default router;
