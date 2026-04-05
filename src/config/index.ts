export const BASE_URL = "https://watchanimeworld.net";

export const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  Connection: "keep-alive",
  "Cache-Control": "max-age=0",
};

export const CACHE_TTL = {
  HOME: 600,         // 10 min
  ANIME_LIST: 900,   // 15 min
  ANIME_DETAIL: 1800, // 30 min
  EPISODE: 1800,     // 30 min
  VIDEO: 1800,       // 30 min
  SEARCH: 300,       // 5 min
};
