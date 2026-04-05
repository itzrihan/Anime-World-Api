import * as cheerio from "cheerio";
import { fetchPage, httpClient } from "../utils/http.js";
import { BASE_URL } from "../config/index.js";

export interface Server {
  name: string;
  index: number;
  embed?: string;
}

export interface VideoResult {
  server: string;
  embed: string | null;
  stream: string | null;
  allServers: Server[];
  note: string;
}

export interface EpisodeDetail {
  title: string;
  number: string;
  animeTitle: string;
  animeSlug: string;
  servers: Server[];
}

function resolveUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("//")) return "https:" + path;
  return `${BASE_URL}${path.startsWith("/") ? path : "/" + path}`;
}

function extractSlug(url: string): string {
  try {
    const clean = url.replace(/\/$/, "");
    const parts = clean.split("/");
    return parts[parts.length - 1] || "";
  } catch {
    return url;
  }
}

function findM3u8(html: string): string | null {
  const m3u8Match = html.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)['"]/);
  return m3u8Match ? m3u8Match[1] : null;
}

async function tryFetchM3u8FromEmbed(embedUrl: string): Promise<string | null> {
  if (!embedUrl) return null;
  try {
    const html = await fetchPage(embedUrl);
    return findM3u8(html);
  } catch {
    return null;
  }
}

function parseEpisodePage($: cheerio.CheerioAPI, html: string): {
  servers: Server[];
  title: string;
  animeTitle: string;
  animeSlug: string;
  number: string;
} {
  // Title
  const title = $("h1.entry-title, h1.title, .entry-title").first().text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    "";

  // Breadcrumb to get parent anime
  const crumbs = $(".breadcrumb a, .crumbs a");
  const animeLink = crumbs.length > 1
    ? $(crumbs[crumbs.length - 2]).attr("href") || ""
    : "";
  const animeSlug = extractSlug(animeLink.replace(/\/$/, ""));
  const animeTitle = crumbs.length > 1
    ? $(crumbs[crumbs.length - 2]).text().trim()
    : "";

  // Extract episode number from URL or title
  const numMatch = title.match(/S(\d+)\s*E(\d+)/i) ||
    title.match(/Season\s*(\d+)\s*Episode\s*(\d+)/i);
  const number = numMatch
    ? `S${numMatch[1]}E${numMatch[2]}`
    : title.match(/Episode\s*(\d+)/i)?.[1] || "";

  // Parse server tabs: .aa-tbs-video contains <a class="btn" href="#options-N">
  const servers: Server[] = [];

  $(".aa-tbs-video a.btn, [data-tbs='aa-options'] a.btn").each((i, el) => {
    const $el = $(el);
    const name = $el.find(".server").text().trim() || $el.text().trim() || `Server ${i + 1}`;
    const optionRef = $el.attr("href") || "";
    const indexMatch = optionRef.match(/#options-(\d+)/);
    const index = indexMatch ? parseInt(indexMatch[1]) : i;

    // Get the embed URL from the corresponding option div
    const optionDiv = $(`#options-${index}`);
    const embed =
      optionDiv.find("iframe").attr("src") ||
      optionDiv.find("iframe").attr("data-src") ||
      undefined;

    servers.push({
      name: name.trim() || `Server ${index + 1}`,
      index,
      embed: embed ? resolveUrl(embed) : undefined,
    });
  });

  // Fallback: parse option divs directly
  if (servers.length === 0) {
    $("[id^='options-']").each((i, el) => {
      const $el = $(el);
      const idMatch = $el.attr("id")?.match(/options-(\d+)/);
      const index = idMatch ? parseInt(idMatch[1]) : i;
      const embed =
        $el.find("iframe").attr("src") ||
        $el.find("iframe").attr("data-src") ||
        undefined;

      servers.push({
        name: `Server ${index + 1}`,
        index,
        embed: embed ? resolveUrl(embed) : undefined,
      });
    });
  }

  return { servers, title, animeTitle, animeSlug, number };
}

export async function scrapeEpisode(slugOrUrl: string): Promise<EpisodeDetail | null> {
  const episodeUrl = slugOrUrl.startsWith("http")
    ? slugOrUrl
    : `${BASE_URL}/episode/${slugOrUrl}/`;

  let html: string;
  try {
    html = await fetchPage(episodeUrl);
  } catch {
    return null;
  }

  const $ = cheerio.load(html);
  const { servers, title, animeTitle, animeSlug, number } = parseEpisodePage($, html);

  return { title, number, animeTitle, animeSlug, servers };
}

async function tryPuppeteerExtraction(episodeUrl: string): Promise<{
  servers: Server[];
  abyss: { embed: string | null; stream: string | null } | null;
}> {
  let puppeteer: typeof import("puppeteer");
  try {
    puppeteer = await import("puppeteer");
  } catch {
    return { servers: [], abyss: null };
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    const capturedM3u8: string[] = [];

    await page.setRequestInterception(true);
    page.on("request", (req: import('puppeteer').HTTPRequest) => {
      const url = req.url();
      if (url.endsWith(".m3u8") || url.includes(".m3u8?")) {
        capturedM3u8.push(url);
      }
      req.continue();
    });

    await page.goto(episodeUrl, { waitUntil: "networkidle2", timeout: 30000 });

    const html = await page.content();
    const $ = cheerio.load(html);
    const { servers } = parseEpisodePage($, html);

    // Try to click Server 2 (index 1)
    const server2Btn = await page.$(".aa-tbs-video a.btn:nth-child(2), [data-tbs='aa-options'] a.btn:nth-child(2)");
    if (server2Btn) {
      await server2Btn.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const iframes = await page.$$eval("iframe[src], iframe[data-src]", (iframes: Element[]) =>
      iframes.map((f: Element) => (f as HTMLIFrameElement).src || (f as HTMLElement).dataset.src || "")
    );

    const secondIframe = iframes[1] || iframes[0] || null;
    const stream = capturedM3u8[0] || null;

    return {
      servers,
      abyss: { embed: secondIframe, stream },
    };
  } finally {
    await browser.close();
  }
}

export async function extractVideo(episodeUrl: string): Promise<VideoResult> {
  let html: string;
  try {
    html = await fetchPage(episodeUrl);
  } catch (err) {
    return {
      server: "Error",
      embed: null,
      stream: null,
      allServers: [],
      note: `Failed to fetch episode page: ${(err as Error).message}`,
    };
  }

  const $ = cheerio.load(html);
  const { servers } = parseEpisodePage($, html);

  // STRATEGY 1: Server 2 is always index 1 (#options-1)
  // Server 1 is zephyrflick (index 0), Server 2 is the second option
  const server2 = servers.find((s) =>
    s.index === 1 ||
    s.name.toLowerCase().includes("server 2") ||
    s.name.toLowerCase().includes("abyss")
  );

  if (server2?.embed) {
    const stream = await tryFetchM3u8FromEmbed(server2.embed).catch(() => null);
    return {
      server: "Server 2",
      embed: server2.embed,
      stream,
      allServers: servers,
      note: "Server 2 embed extracted via static scraping",
    };
  }

  // STRATEGY 2: Check #options-1 directly for a data-src iframe
  const options1 = $("#options-1");
  if (options1.length) {
    const dataSrcEmbed =
      options1.find("iframe").attr("data-src") ||
      options1.find("iframe").attr("src");
    if (dataSrcEmbed) {
      const embed = resolveUrl(dataSrcEmbed);
      const stream = await tryFetchM3u8FromEmbed(embed).catch(() => null);
      return {
        server: "Server 2",
        embed,
        stream,
        allServers: servers,
        note: "Server 2 iframe found in #options-1 via static scraping",
      };
    }
  }

  // STRATEGY 3: Try AJAX - the site may load server embeds via admin-ajax.php
  try {
    const postId =
      $("[data-post]").first().attr("data-post") ||
      $("body").attr("class")?.match(/postid-(\d+)/)?.[1] ||
      html.match(/"post_id"\s*:\s*"?(\d+)"?/)?.[1];

    if (postId) {
      const ajaxUrl = `${BASE_URL}/wp-admin/admin-ajax.php`;
      const formData = new URLSearchParams({
        action: "doo_player_ajax",
        post: postId,
        nume: "2",
        type: "tv",
      });

      const response = await httpClient.post<{ embed_url?: string; embed?: string; data?: string }>(
        ajaxUrl,
        formData.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Referer: episodeUrl,
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );

      const data = response.data;
      let embed: string | null = null;

      if (data?.embed_url) embed = data.embed_url;
      else if (data?.embed) embed = data.embed;
      else if (typeof data?.data === "string") {
        const $ajax = cheerio.load(data.data);
        embed = $ajax("iframe").first().attr("src") || null;
      }

      if (embed) {
        const stream = await tryFetchM3u8FromEmbed(embed).catch(() => null);
        return {
          server: "Server 2",
          embed,
          stream,
          allServers: servers,
          note: "Server 2 extracted via AJAX player API",
        };
      }
    }
  } catch {
    // AJAX failed, continue to Puppeteer
  }

  // STRATEGY 4: Puppeteer fallback
  try {
    const puppResult = await tryPuppeteerExtraction(episodeUrl);
    const allSrvs = puppResult.servers.length ? puppResult.servers : servers;

    if (puppResult.abyss?.embed) {
      return {
        server: "Server 2",
        embed: puppResult.abyss.embed,
        stream: puppResult.abyss.stream,
        allServers: allSrvs,
        note: "Server 2 extracted via Puppeteer browser automation",
      };
    }
  } catch {
    // Puppeteer failed or not available
  }

  // Return Server 1 as fallback if nothing else worked
  const server1 = servers.find((s) => s.index === 0);
  if (server1?.embed) {
    return {
      server: "Server 1 (Fallback)",
      embed: server1.embed,
      stream: await tryFetchM3u8FromEmbed(server1.embed).catch(() => null),
      allServers: servers,
      note: "Could not extract Server 2. Returning Server 1 as fallback.",
    };
  }

  return {
    server: "Unknown",
    embed: null,
    stream: null,
    allServers: servers,
    note: "All extraction strategies failed. The video may require browser-level JavaScript.",
  };
}
