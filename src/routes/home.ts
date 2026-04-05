import { Router } from "express";
import { scrapeHome } from "../services/homeService.js";
import { getCache, setCache } from "../utils/cache.js";
import { CACHE_TTL } from "../config/index.js";
const router = Router();
router.get("/home", async (_req, res) => {
  const cached = getCache<object>("home");
  if (cached) { res.json({ success: true, data: cached, cached: true }); return; }
  try {
    const data = await scrapeHome();
    setCache("home", data, CACHE_TTL.HOME);
    res.json({ success: true, data, cached: false });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch home data" });
  }
});
export default router;
