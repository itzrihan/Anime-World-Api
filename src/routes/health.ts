import { Router } from "express";
const router = Router();
router.get("/", (_req, res) => {
  res.json({
    message: "Web Scrape Bot API",
    version: "1.0.0",
    endpoints: { health: "/api/healthz", home: "/api/home", anime: "/api/anime", episode: "/api/episode/:id", video: "/api/video" }
  });
});
router.get("/healthz", (_req, res) => res.json({ status: "ok" }));
export default router;
