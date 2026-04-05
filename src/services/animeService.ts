import * as cheerio from "cheerio";
import { fetchPage } from "../utils/http.js";
import { BASE_URL } from "../config/index.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnimeCard {
  title: string;
  slug: string;
  url: string;
  thumbnail: string;
  rating?: string;
  type?: string;
  status?: string;
  genres?: string[];
  episodes?: string;
  season?: string;
  language?: string;
}

export interface SeasonInfo {
  name: string;
  number: number;
  slug: string;
  url: string;
  episodeCount?: number;
}

export interface EpisodeEntry {
  title: string;
  number: string;
  season?: string;
  seasonNumber?: number;
  url: string;
  slug: string;
  date?: string;
  thumbnail?: string;
}

export interface AnimeDetail {
  title: string;
  slug: string;
  url: string;
  thumbnail: string;
  description: string;
  genres: string[];
  releaseYear?: string;
  status?: string;
  type?: string;
  rating?: string;
  language?: string;
  seasons: SeasonInfo[];
  currentSeason?: SeasonInfo;
  episodes: EpisodeEntry[];
  totalEpisodes: number;
}

export interface PaginationInfo {
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalPages?: number;
  pages: number[];
}

export interface PagedResult<T> {
  data: T[];
  pagination: PaginationInfo;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("//")) return "https:" + path;
  return `${BASE_URL}${path.startsWith("/") ? path : "/" + path}`;
}

function extractSlug(url: string): string {
  try {
    const clean = url.replace(/\/$/, "");
    return clean.split("/").pop() || "";
  } catch {
    return url;
  }
}

function isValidPage(html: string): boolean {
  if (!html || html.length < 500) return false;
  if (html.includes("404") && html.includes("Page Not Found")) return false;
  if (html.includes("page-not-found")) return false;
  return true;
}

function parsePagination($: cheerio.CheerioAPI, currentPage: number): PaginationInfo {
  const pages: number[] = [];

  $(".page-numbers a, .pagination a, nav.navigation a, .nav-links a").each((_i, el) => {
    const num = parseInt($(el).text().trim());
    if (!isNaN(num) && num > 0 && !pages.includes(num)) pages.push(num);
  });

  $(".page-numbers.current, .pagination .current").each((_i, el) => {
    const num = parseInt($(el).text().trim());
    if (!isNaN(num) && !pages.includes(num)) pages.push(num);
  });

  if (!pages.includes(currentPage)) pages.push(currentPage);
  pages.sort((a, b) => a - b);

  const totalPages = pages.length > 0 ? pages[pages.length - 1] : undefined;
  const hasNextPage =
    $("a.next, a[rel='next'], .page-numbers.next").length > 0 ||
    $("a:contains('NEXT'), a:contains('Next')").length > 0;
  const hasPrevPage =
    $("a.prev, a[rel='prev'], .page-numbers.prev").length > 0 || currentPage > 1;

  return { currentPage, hasNextPage, hasPrevPage, totalPages, pages };
}

function parseArticle($: cheerio.CheerioAPI, el: any): AnimeCard | null {
  const $el = $(el);
  const linkEl = $el.find("a[href*='/series/']").first();
  const href = linkEl.attr("href") || $el.find("a").first().attr("href") || "";
  if (!href || !href.includes("/series/")) return null;

  const url = resolveUrl(href);
  const title =
    $el.find("h2.entry-title, h3.entry-title, .entry-title").first().text().trim() ||
    $el.find("img").first().attr("alt")?.replace(/^Image\s+/i, "") || "";
  const thumbnail =
    $el.find("img").first().attr("src") ||
    $el.find("img").first().attr("data-src") || "";
  const episodes = $el.find(".year").first().text().trim();
  const season = $el.find(".post-ql").first().text().trim();
  const rating = $el.find(".rating span, .imdb, .rate").first().text().trim();
  const labels = $el.find(".labels, .cats, .badge, .post-cats").text().toLowerCase();
  const language = labels.includes("hindi") ? "Hindi"
    : labels.includes("tamil") ? "Tamil"
    : labels.includes("telugu") ? "Telugu"
    : labels.includes("english") ? "English"
    : undefined;

  if (!title || !url) return null;

  return {
    title,
    slug: extractSlug(url),
    url,
    thumbnail: resolveUrl(thumbnail),
    rating: rating || undefined,
    episodes: episodes || undefined,
    season: season || undefined,
    language,
  };
}

// ─── OPTIMIZATION: Binary search for last valid episode ──────────────────────
// Old method: sequential probe 1,2,3...200 per season = up to 200 HTTP requests
// New method: exponential scan + binary search = ~8-12 HTTP requests regardless of count
// For a 26-episode season: saves ~14 requests. For 100 episodes: saves ~88 requests!

async function episodeExists(slug: string, season: number, ep: number): Promise<boolean> {
  const url = `${BASE_URL}/episode/${slug}-${season}x${ep}/`;
  try {
    const html = await fetchPage(url);
    return isValidPage(html);
  } catch {
    return false;
  }
}

async function findLastEpisode(slug: string, season: number): Promise<number> {
  // Episode 1 is already confirmed to exist by the caller
  // Exponential scan: try ep 2, 4, 8, 16... to find upper bound fast
  let upper = 1;
  const checks: Promise<boolean>[] = [];

  // Probe 2,4,8,16,32,64,128 in parallel for speed
  const probePoints = [2, 4, 8, 16, 32, 64, 128];
  const probeResults = await Promise.all(
    probePoints.map((ep) => episodeExists(slug, season, ep))
  );

  // Find the boundary: last true point
  upper = 1;
  for (let i = 0; i < probePoints.length; i++) {
    if (probeResults[i]) upper = probePoints[i];
    else break;
  }

  // If all probes passed, push upper further
  if (upper === 128) {
    const farProbes = [200, 300, 500];
    const farResults = await Promise.all(
      farProbes.map((ep) => episodeExists(slug, season, ep))
    );
    for (let i = 0; i < farProbes.length; i++) {
      if (farResults[i]) upper = farProbes[i];
      else break;
    }
  }

  // Find the hi boundary (first false after upper)
  let hi = upper === 1 ? 2 : upper * 2;
  if (hi > 600) hi = 600;

  // Binary search between upper and hi
  let lo = upper;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    const exists = await episodeExists(slug, season, mid);
    if (exists) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  return lo;
}

// ─── Build episode list from count (zero extra HTTP calls) ───────────────────

function buildEpisodeEntries(slug: string, season: number, count: number): EpisodeEntry[] {
  const entries: EpisodeEntry[] = [];
  for (let ep = 1; ep <= count; ep++) {
    const epSlug = `${slug}-${season}x${ep}`;
    entries.push({
      title: `Episode S${season}E${ep}`,
      number: `S${season}E${ep}`,
      season: `Season ${season}`,
      seasonNumber: season,
      url: `${BASE_URL}/episode/${epSlug}/`,
      slug: epSlug,
    });
  }
  return entries;
}

// ─── Probe all seasons in PARALLEL + binary search per season ─────────────────

async function detectAllSeasonsAndEpisodes(slug: string): Promise<{
  seasons: SeasonInfo[];
  episodes: EpisodeEntry[];
}> {
  const MAX_SEASONS = 10;

  // Step 1: Check which seasons exist — probe S1E1 through S10E1 in parallel (fast, unchanged)
  const seasonExistsResults = await Promise.all(
    Array.from({ length: MAX_SEASONS }, (_, i) => i + 1).map(async (s) => {
      const url = `${BASE_URL}/episode/${slug}-${s}x1/`;
      try {
        const html = await fetchPage(url);
        return isValidPage(html) ? s : null;
      } catch {
        return null;
      }
    })
  );

  const validSeasonNums = seasonExistsResults.filter((s): s is number => s !== null);

  if (validSeasonNums.length === 0) {
    return { seasons: [], episodes: [] };
  }

  // Step 2: Binary-search for last episode in each valid season — all seasons in parallel
  const episodeCounts = await Promise.all(
    validSeasonNums.map((s) => findLastEpisode(slug, s))
  );

  // Step 3: Build all episode entries instantly (no extra HTTP calls needed)
  const seasons: SeasonInfo[] = [];
  const allEpisodes: EpisodeEntry[] = [];

  validSeasonNums.forEach((s, i) => {
    const count = episodeCounts[i];
    const eps = buildEpisodeEntries(slug, s, count);
    seasons.push({
      name: `Season ${s}`,
      number: s,
      slug,
      url: `${BASE_URL}/series/${slug}/`,
      episodeCount: count,
    });
    allEpisodes.push(...eps);
  });

  return { seasons, episodes: allEpisodes };
}

// ─── Anime Detail ─────────────────────────────────────────────────────────────

export async function scrapeAnimeDetail(
  slug: string,
  seasonNumber?: number
): Promise<AnimeDetail | null> {
  const baseUrl = `${BASE_URL}/series/${slug}/`;

  // OPTIMIZATION: Fire metadata fetch AND season detection simultaneously
  const baseHtmlPromise = fetchPage(baseUrl).catch(() => fetchPage(`${BASE_URL}/${slug}/`));
  const seasonsPromise = detectAllSeasonsAndEpisodes(slug);

  let baseHtml: string;
  let seasonsResult: { seasons: SeasonInfo[]; episodes: EpisodeEntry[] };

  try {
    [baseHtml, seasonsResult] = await Promise.all([baseHtmlPromise, seasonsPromise]);
  } catch {
    return null;
  }

  const $base = cheerio.load(baseHtml);

  const title =
    $base("h1.entry-title, h1.title, .entry-title").first().text().trim() ||
    $base("h1").first().text().trim();

  if (!title) return null;

  const thumbnail =
    $base(".post-thumbnail img, .thumb img, .featured-image img").first().attr("src") ||
    $base(".post-thumbnail img, .thumb img, .featured-image img").first().attr("data-src") ||
    $base('meta[property="og:image"]').attr("content") || "";

  const description =
    $base(".wp-content p, [class*='description'] p, [class*='sinopsis'] p").first().text().trim() ||
    $base('meta[name="description"]').attr("content") || "";

  const genres: string[] = [];
  $base("a[href*='/genre/'], a[href*='/category/']").each((_i, el) => {
    const g = $base(el).text().trim();
    if (g && g.length < 40 && !g.toLowerCase().includes("page")) genres.push(g);
  });

  const releaseYear =
    $base(".date, .year").first().text().trim().match(/\d{4}/)?.[0] ||
    $base('meta[property="og:updated_time"]').attr("content")?.slice(0, 4);

  const status = $base(".status").first().text().trim();
  const rating = $base(".rating-content, .imdb, .score").first().text().trim();

  const pageText = $base("body").text().toLowerCase();
  const language = pageText.includes("hindi") ? "Hindi"
    : pageText.includes("tamil") ? "Tamil"
    : pageText.includes("telugu") ? "Telugu"
    : pageText.includes("english dubbed") ? "English"
    : undefined;

  const { seasons, episodes } = seasonsResult;

  let filteredEpisodes = episodes;
  if (seasonNumber !== undefined) {
    filteredEpisodes = episodes.filter(ep => ep.seasonNumber === seasonNumber);
  }

  const currentSeason = seasonNumber !== undefined
    ? seasons.find(s => s.number === seasonNumber)
    : seasons[seasons.length - 1];

  return {
    title,
    slug,
    url: baseUrl,
    thumbnail: resolveUrl(thumbnail),
    description,
    genres: [...new Set(genres)],
    releaseYear,
    status: status || undefined,
    type: undefined,
    rating: rating || undefined,
    language,
    seasons,
    currentSeason,
    episodes: filteredEpisodes,
    totalEpisodes: filteredEpisodes.length,
  };
}

// ─── Anime List ───────────────────────────────────────────────────────────────

export async function scrapeAnimeList(page = 1): Promise<PagedResult<AnimeCard>> {
  const url = page === 1 ? `${BASE_URL}/` : `${BASE_URL}/page/${page}/`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);
  const data: AnimeCard[] = [];

  $("article.post").each((_i, el) => {
    const card = parseArticle($, el);
    if (card && !data.find((d) => d.slug === card.slug)) data.push(card);
  });

  if (data.length === 0) {
    $("a[href*='/series/']").each((_i, el) => {
      const href = $(el).attr("href") || "";
      if (!href || href.match(/\/series\/(page\/\d+\/)?$/)) return;
      const itemUrl = resolveUrl(href);
      const slug = extractSlug(itemUrl);
      const title =
        $(el).attr("title") ||
        $(el).find("img").attr("alt")?.replace(/^Image\s+/i, "") ||
        $(el).text().trim();
      if (!title || !slug || data.find((d) => d.slug === slug)) return;
      data.push({ title, slug, url: itemUrl, thumbnail: "" });
    });
  }

  return { data, pagination: parsePagination($, page) };
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function scrapeSearch(query: string, page = 1): Promise<PagedResult<AnimeCard>> {
  const searchUrl = page === 1
    ? `${BASE_URL}/?s=${encodeURIComponent(query)}`
    : `${BASE_URL}/page/${page}/?s=${encodeURIComponent(query)}`;

  const html = await fetchPage(searchUrl);
  const $ = cheerio.load(html);
  const data: AnimeCard[] = [];

  $("article.post").each((_i, el) => {
    const card = parseArticle($, el);
    if (card) data.push(card);
  });

  if (data.length === 0) {
    $("a[href*='/series/']").each((_i, el) => {
      const href = $(el).attr("href") || "";
      if (!href || href.match(/\/series\/(page\/\d+\/)?$/)) return;
      const itemUrl = resolveUrl(href);
      const slug = extractSlug(itemUrl);
      if (data.find((d) => d.slug === slug)) return;
      const title = $(el).attr("title") || $(el).text().trim();
      if (title && slug) data.push({ title, slug, url: itemUrl, thumbnail: "" });
    });
  }

  return { data, pagination: parsePagination($, page) };
}

// ─── Genre ────────────────────────────────────────────────────────────────────

export async function scrapeByGenre(genre: string, page = 1): Promise<PagedResult<AnimeCard>> {
  const url = page === 1
    ? `${BASE_URL}/category/${genre}/`
    : `${BASE_URL}/category/${genre}/page/${page}/`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);
  const data: AnimeCard[] = [];

  $("article.post").each((_i, el) => {
    const card = parseArticle($, el);
    if (card) data.push(card);
  });

  if (data.length === 0) {
    $("a[href*='/series/']").each((_i, el) => {
      const href = $(el).attr("href") || "";
      if (!href || href.match(/\/series\/(page\/)?$/)) return;
      const itemUrl = resolveUrl(href);
      const slug = extractSlug(itemUrl);
      if (data.find((d) => d.slug === slug)) return;
      const title = $(el).attr("title") || $(el).text().trim();
      if (title && slug) data.push({ title, slug, url: itemUrl, thumbnail: "" });
    });
  }

  return { data, pagination: parsePagination($, page) };
}

// ─── Top Anime ────────────────────────────────────────────────────────────────

export async function scrapeTopAnime(): Promise<AnimeCard[]> {
  const html = await fetchPage(`${BASE_URL}/category/anime/`);
  const $ = cheerio.load(html);
  const data: AnimeCard[] = [];

  $("article.post").each((_i, el) => {
    const card = parseArticle($, el);
    if (card) data.push(card);
  });

  if (data.length === 0) {
    $("a[href*='/series/']").each((_i, el) => {
      const href = $(el).attr("href") || "";
      if (!href || href.match(/\/series\/(page\/\d+\/)?$/)) return;
      const itemUrl = resolveUrl(href);
      const slug = extractSlug(itemUrl);
      const title =
        $(el).attr("title") ||
        $(el).find("img").attr("alt")?.replace(/^Image\s+/i, "") ||
        $(el).text().trim();
      if (title && slug && !data.find((d) => d.slug === slug))
        data.push({ title, slug, url: itemUrl, thumbnail: "" });
    });
  }

  return data;
}

// ─── Cartoons ─────────────────────────────────────────────────────────────────

export async function scrapeCartoons(page = 1): Promise<PagedResult<AnimeCard>> {
  const url = page === 1
    ? `${BASE_URL}/category/cartoon/`
    : `${BASE_URL}/category/cartoon/page/${page}/`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);
  const data: AnimeCard[] = [];

  $("article.post").each((_i, el) => {
    const card = parseArticle($, el);
    if (card) data.push(card);
  });

  if (data.length === 0) {
    $("a[href*='/series/']").each((_i, el) => {
      const href = $(el).attr("href") || "";
      if (!href || href.match(/\/series\/(page\/)?$/)) return;
      const itemUrl = resolveUrl(href);
      const slug = extractSlug(itemUrl);
      if (data.find((d) => d.slug === slug)) return;
      const title = $(el).attr("title") || $(el).text().trim();
      if (title && slug) data.push({ title, slug, url: itemUrl, thumbnail: "" });
    });
  }

  return { data, pagination: parsePagination($, page) };
}

// ─── Movies ───────────────────────────────────────────────────────────────────

export async function scrapeMovies(page = 1): Promise<PagedResult<AnimeCard>> {
  const url = page === 1
    ? `${BASE_URL}/category/movie/`
    : `${BASE_URL}/category/movie/page/${page}/`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);
  const data: AnimeCard[] = [];

  $("article.post").each((_i, el) => {
    const card = parseArticle($, el);
    if (card) data.push(card);
  });

  if (data.length === 0) {
    $("a[href*='/series/'], a[href*='/movie/']").each((_i, el) => {
      const href = $(el).attr("href") || "";
      if (!href) return;
      const itemUrl = resolveUrl(href);
      const slug = extractSlug(itemUrl);
      if (data.find((d) => d.slug === slug)) return;
      const title = $(el).attr("title") || $(el).text().trim();
      if (title && slug) data.push({ title, slug, url: itemUrl, thumbnail: "" });
    });
  }

  return { data, pagination: parsePagination($, page) };
}

// ─── Language Filter ──────────────────────────────────────────────────────────

export async function scrapeByLanguage(
  language: "hindi" | "tamil" | "telugu" | "english" | "japanese",
  page = 1
): Promise<PagedResult<AnimeCard>> {
  const langMap: Record<string, string> = {
    hindi: "hindi-dubbed",
    tamil: "tamil-dubbed",
    telugu: "telugu-dubbed",
    english: "english-dubbed",
    japanese: "japanese",
  };

  const catSlug = langMap[language] || language;
  const url = page === 1
    ? `${BASE_URL}/category/${catSlug}/`
    : `${BASE_URL}/category/${catSlug}/page/${page}/`;

  const html = await fetchPage(url);
  const $ = cheerio.load(html);
  const data: AnimeCard[] = [];

  $("article.post").each((_i, el) => {
    const card = parseArticle($, el);
    if (card) data.push(card);
  });

  if (data.length === 0) {
    $("a[href*='/series/']").each((_i, el) => {
      const href = $(el).attr("href") || "";
      if (!href || href.match(/\/series\/(page\/)?$/)) return;
      const itemUrl = resolveUrl(href);
      const slug = extractSlug(itemUrl);
      if (data.find((d) => d.slug === slug)) return;
      const title = $(el).attr("title") || $(el).text().trim();
      if (title && slug) data.push({ title, slug, url: itemUrl, thumbnail: "" });
    });
  }

  return { data, pagination: parsePagination($, page) };
}

// ─── Genre List ───────────────────────────────────────────────────────────────

export async function scrapeGenreList(): Promise<{ name: string; slug: string; url: string }[]> {
  const html = await fetchPage(BASE_URL);
  const $ = cheerio.load(html);
  const genres: { name: string; slug: string; url: string }[] = [];
  const seen = new Set<string>();

  $("a[href*='/category/'], a[href*='/genre/']").each((_i, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim();
    if (!href || !text || text.length > 40) return;
    const slug = extractSlug(resolveUrl(href));
    if (!slug || seen.has(slug)) return;
    seen.add(slug);
    genres.push({ name: text, slug, url: resolveUrl(href) });
  });

  return genres;
}
