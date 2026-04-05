import * as cheerio from "cheerio";
import { fetchPage } from "../utils/http.js";
import { BASE_URL } from "../config/index.js";

export interface AnimeCard {
  title: string; slug: string; url: string; thumbnail: string;
  rating?: string; type?: string; episodes?: string; season?: string;
}

export interface HomeData {
  featured: AnimeCard[]; latestEpisodes: AnimeCard[];
  trending: AnimeCard[]; recentlyUpdated: AnimeCard[];
}

function resolveUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("//")) return "https:" + path;
  return `${BASE_URL}${path.startsWith("/") ? path : "/" + path}`;
}

function extractSlug(url: string): string {
  try { const clean = url.replace(/\/$/, ""); return clean.split("/").pop() || ""; }
  catch { return url; }
}

function parseArticle($: cheerio.CheerioAPI, el: cheerio.Element): AnimeCard | null {
  const $el = $(el);
  const linkEl = $el.find("a[href*='/series/'], a[href*='/episode/']").first();
  const href = linkEl.attr("href") || $el.find("a").first().attr("href") || "";
  if (!href) return null;
  const url = resolveUrl(href);
  const title = $el.find("h2.entry-title, h3.entry-title, .entry-title").first().text().trim() ||
    $el.find("img").first().attr("alt")?.replace(/^Image\s+/i, "") || "";
  const thumbnail = $el.find("img").first().attr("src") || $el.find("img").first().attr("data-src") || "";
  if (!title || !url) return null;
  return {
    title, slug: extractSlug(url), url,
    thumbnail: resolveUrl(thumbnail),
    rating: $el.find(".rating span, .imdb, .rate").first().text().trim() || undefined,
    episodes: $el.find(".year").first().text().trim() || undefined,
    season: $el.find(".post-ql").first().text().trim() || undefined,
  };
}

export async function scrapeHome(): Promise<HomeData> {
  const html = await fetchPage(BASE_URL);
  const $ = cheerio.load(html);
  const latestEpisodes: AnimeCard[] = [];
  $("article.post").each((_i, el) => {
    const card = parseArticle($, el);
    if (card) latestEpisodes.push(card);
  });
  return {
    featured: latestEpisodes.slice(0, 10),
    latestEpisodes: latestEpisodes.slice(0, 20),
    trending: latestEpisodes.slice(0, 10),
    recentlyUpdated: latestEpisodes.slice(0, 10),
  };
}
