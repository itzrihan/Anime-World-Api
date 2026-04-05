import { Router } from "express";
import { scrapeEpisode } from "../services/videoService.js";
import { getCache, setCache } from "../utils/cache.js";
import { CACHE_TTL } from "../config/index.js";
const router = Router();
router.get("/episode/:id", async (req, res) => {
  const slug = req.params.id;
  const cacheKey = `episode-${slug}`;
  const cached = getCache<object>(cacheKey);
  if (cached) { res.json({ success: true, data: cached, cached: true }); return; }
  try {
    const data = await scrapeEpisode(slug);
    if (!data) { res.status(404).json({ success: false, error: "Episode not found" }); return; }
    setCache(cacheKey, data, CACHE_TTL.EPISODE);
    res.json({ success: true, data, cached: false });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch episode data" });
  }
});
export default router;
