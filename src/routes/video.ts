import { Router } from "express";
import { extractVideo } from "../services/videoService.js";
import { getCache, setCache } from "../utils/cache.js";
import { CACHE_TTL } from "../config/index.js";
const router = Router();
router.get("/video", async (req, res) => {
  const url = String(req.query.url || "").trim();
  if (!url) { res.status(400).json({ success: false, error: "Query parameter 'url' is required" }); return; }
  const cacheKey = `video-${Buffer.from(url).toString("base64")}`;
  const cached = getCache<object>(cacheKey);
  if (cached) { res.json({ success: true, data: cached, cached: true }); return; }
  try {
    const data = await extractVideo(url);
    if (data.embed) setCache(cacheKey, data, CACHE_TTL.VIDEO);
    res.json({ success: true, data, cached: false });
  } catch {
    res.status(500).json({ success: false, error: "Failed to extract video source" });
  }
});
export default router;
