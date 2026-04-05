import { Router } from "express";
import {
  scrapeAnimeList,
  scrapeAnimeDetail,
  scrapeSearch,
  scrapeByGenre,
  scrapeTopAnime,
  scrapeCartoons,
  scrapeMovies,
  scrapeByLanguage,
  scrapeGenreList,
} from "../services/animeService.js";
import { getCache, setCache } from "../utils/cache.js";
import { CACHE_TTL } from "../config/index.js";

const router = Router();

// GET /anime?page=1
router.get("/anime", async (req, res) => {
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const cacheKey = `anime-list-${page}`;
  const cached = getCache<object>(cacheKey);
  if (cached) {
    res.json({ success: true, ...cached, cached: true });
    // Background refresh
    scrapeAnimeList(page)
      .then(fresh => setCache(cacheKey, fresh, CACHE_TTL.ANIME_LIST))
      .catch(() => {});
    return;
  }
  try {
    const result = await scrapeAnimeList(page);
    setCache(cacheKey, result, CACHE_TTL.ANIME_LIST);
    res.json({ success: true, ...result, cached: false });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch anime list" });
  }
});

// GET /anime/top
router.get("/anime/top", async (_req, res) => {
  const cached = getCache<object[]>("anime-top");
  if (cached) {
    res.json({ success: true, data: cached, cached: true });
    // Background refresh
    scrapeTopAnime()
      .then(fresh => setCache("anime-top", fresh, CACHE_TTL.ANIME_LIST))
      .catch(() => {});
    return;
  }
  try {
    const data = await scrapeTopAnime();
    setCache("anime-top", data, CACHE_TTL.ANIME_LIST);
    res.json({ success: true, data, cached: false });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch top anime" });
  }
});

// GET /anime/search?q=naruto&page=1
router.get("/anime/search", async (req, res) => {
  const query = String(req.query.q || "").trim();
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  if (!query) {
    res.status(400).json({ success: false, error: "Query parameter 'q' is required" });
    return;
  }
  const cacheKey = `search-${query}-${page}`;
  const cached = getCache<object>(cacheKey);
  if (cached) {
    res.json({ success: true, ...cached, cached: true });
    // Background refresh
    scrapeSearch(query, page)
      .then(fresh => setCache(cacheKey, fresh, CACHE_TTL.SEARCH))
      .catch(() => {});
    return;
  }
  try {
    const result = await scrapeSearch(query, page);
    setCache(cacheKey, result, CACHE_TTL.SEARCH);
    res.json({ success: true, ...result, cached: false });
  } catch {
    res.status(500).json({ success: false, error: "Search failed" });
  }
});

// GET /anime/genre/:genre?page=1
router.get("/anime/genre/:genre", async (req, res) => {
  const genre = req.params.genre;
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const cacheKey = `genre-${genre}-${page}`;
  const cached = getCache<object>(cacheKey);
  if (cached) {
    res.json({ success: true, ...cached, cached: true });
    // Background refresh
    scrapeByGenre(genre, page)
      .then(fresh => setCache(cacheKey, fresh, CACHE_TTL.ANIME_LIST))
      .catch(() => {});
    return;
  }
  try {
    const result = await scrapeByGenre(genre, page);
    setCache(cacheKey, result, CACHE_TTL.ANIME_LIST);
    res.json({ success: true, ...result, cached: false });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch genre anime" });
  }
});

// GET /genres
router.get("/genres", async (_req, res) => {
  const cached = getCache<object[]>("genre-list");
  if (cached) {
    res.json({ success: true, data: cached, cached: true });
    // Background refresh
    scrapeGenreList()
      .then(fresh => setCache("genre-list", fresh, CACHE_TTL.ANIME_LIST))
      .catch(() => {});
    return;
  }
  try {
    const data = await scrapeGenreList();
    setCache("genre-list", data, CACHE_TTL.ANIME_LIST);
    res.json({ success: true, data, cached: false });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch genres" });
  }
});

// GET /cartoons?page=1
router.get("/cartoons", async (req, res) => {
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const cacheKey = `cartoons-${page}`;
  const cached = getCache<object>(cacheKey);
  if (cached) {
    res.json({ success: true, ...cached, cached: true });
    // Background refresh
    scrapeCartoons(page)
      .then(fresh => setCache(cacheKey, fresh, CACHE_TTL.ANIME_LIST))
      .catch(() => {});
    return;
  }
  try {
    const result = await scrapeCartoons(page);
    setCache(cacheKey, result, CACHE_TTL.ANIME_LIST);
    res.json({ success: true, ...result, cached: false });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch cartoons" });
  }
});

// GET /movies?page=1
router.get("/movies", async (req, res) => {
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const cacheKey = `movies-${page}`;
  const cached = getCache<object>(cacheKey);
  if (cached) {
    res.json({ success: true, ...cached, cached: true });
    // Background refresh
    scrapeMovies(page)
      .then(fresh => setCache(cacheKey, fresh, CACHE_TTL.ANIME_LIST))
      .catch(() => {});
    return;
  }
  try {
    const result = await scrapeMovies(page);
    setCache(cacheKey, result, CACHE_TTL.ANIME_LIST);
    res.json({ success: true, ...result, cached: false });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch movies" });
  }
});

// GET /language/:lang?page=1
router.get("/language/:lang", async (req, res) => {
  const lang = req.params.lang as "hindi" | "tamil" | "telugu" | "english" | "japanese";
  const validLangs = ["hindi", "tamil", "telugu", "english", "japanese"];
  if (!validLangs.includes(lang)) {
    res.status(400).json({ success: false, error: `Invalid language. Use one of: ${validLangs.join(", ")}` });
    return;
  }
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const cacheKey = `lang-${lang}-${page}`;
  const cached = getCache<object>(cacheKey);
  if (cached) {
    res.json({ success: true, ...cached, cached: true });
    // Background refresh
    scrapeByLanguage(lang, page)
      .then(fresh => setCache(cacheKey, fresh, CACHE_TTL.ANIME_LIST))
      .catch(() => {});
    return;
  }
  try {
    const result = await scrapeByLanguage(lang, page);
    setCache(cacheKey, result, CACHE_TTL.ANIME_LIST);
    res.json({ success: true, ...result, cached: false });
  } catch {
    res.status(500).json({ success: false, error: `Failed to fetch ${lang} content` });
  }
});

// GET /anime/:id?season=1&seasonSlug=jujutsu-kaisen-season-2
router.get("/anime/:id", async (req, res) => {
  const slug = req.params.id;
  const seasonParam = req.query.season;
  const seasonNumber = seasonParam ? parseInt(String(seasonParam), 10) : undefined;
  const seasonSlug = req.query.seasonSlug ? String(req.query.seasonSlug) : undefined;
  const targetSlug = seasonSlug || slug;
  const cacheKey = `anime-detail-${targetSlug}-s${seasonNumber ?? "all"}`;

  const cached = getCache<object>(cacheKey);

  if (cached) {
    // ✅ Return instantly from cache
    res.json({ success: true, data: cached, cached: true });

    // 🔄 Silently refresh cache in background — user never waits
    scrapeAnimeDetail(slug, seasonNumber)
      .then(async (fresh) => {
        if (!fresh) return;
        if (seasonSlug && seasonSlug !== slug) {
          const seasonData = await scrapeAnimeDetail(seasonSlug, undefined).catch(() => null);
          if (seasonData) {
            fresh.episodes = seasonData.episodes;
            fresh.totalEpisodes = seasonData.totalEpisodes;
            seasonData.seasons.forEach((s) => {
              if (!fresh.seasons.find((existing: any) => existing.number === s.number)) {
                fresh.seasons.push(s);
              }
            });
            fresh.seasons.sort((a: any, b: any) => a.number - b.number);
          }
        }
        setCache(cacheKey, fresh, CACHE_TTL.ANIME_DETAIL);
      })
      .catch(() => {});

    return;
  }

  // First-ever request for this anime — must fetch (only slow this one time)
  try {
    const data = await scrapeAnimeDetail(slug, seasonNumber);
    if (!data) {
      res.status(404).json({ success: false, error: "Anime not found" });
      return;
    }

    if (seasonSlug && seasonSlug !== slug) {
      const seasonData = await scrapeAnimeDetail(seasonSlug, undefined);
      if (seasonData) {
        data.episodes = seasonData.episodes;
        data.totalEpisodes = seasonData.totalEpisodes;
        seasonData.seasons.forEach((s) => {
          if (!data.seasons.find((existing) => existing.number === s.number)) {
            data.seasons.push(s);
          }
        });
        data.seasons.sort((a, b) => a.number - b.number);
      }
    }

    setCache(cacheKey, data, CACHE_TTL.ANIME_DETAIL);
    res.json({ success: true, data, cached: false });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch anime details" });
  }
});

export default router;
