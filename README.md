# 🎌 Hindi Anime API

<div align="center">

![Hindi Anime API Banner](https://img.shields.io/badge/Hindi%20Anime%20API-v1.0-ff4d6d?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-7c3aed?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-06b6d4?style=for-the-badge)

**A scraper REST API for [watchanimeworld.net](https://watchanimeworld.net)**  
Serving Hindi, Tamil, Telugu, English dubbed anime, cartoons, and movies.

[Endpoints](#-api-endpoints) · [Setup](#-setup) · [Pagination](#-pagination) · [Caching](#-caching)

</div>

---

## ✨ Features

- 🇮🇳 **Multi-language support** — Hindi, Tamil, Telugu, English, Japanese
- 📺 **Full anime detail** with season & episode filtering
- 🔍 **Search** by title with pagination
- 🎭 **Genre & category** browsing
- 🎬 **Movies & Cartoons** endpoints
- ⚡ **Built-in caching** for fast responses
- 📄 **Consistent pagination** across all list endpoints

---

## 🚀 Setup

```bash
# 1. Clone the repository
git clone https://github.com/dev-abrarfahim/hindi-anime-api.git
cd hindi-anime-api

# 2. Copy environment file
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Start the server
npm run dev        # development
npm run build && npm start   # production
```

---

## 📡 API Endpoints

### 🏠 Home
```
GET /api/home
```
Returns featured, latest episodes, trending, and recently updated content.

---

### 📺 Anime List
```
GET /api/anime?page=1
```

| Query | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |

---

### 🎌 Anime Detail
```
GET /api/anime/:slug
GET /api/anime/:slug?season=2
```

| Query | Type | Default | Description |
|-------|------|---------|-------------|
| `season` | number | latest | Filter episodes by season number |

<details>
<summary>📋 Response Example</summary>

```json
{
  "success": true,
  "data": {
    "title": "Jujutsu Kaisen",
    "slug": "jujutsu-kaisen",
    "seasons": [
      { "name": "Season 1", "number": 1, "episodeCount": 24 },
      { "name": "Season 2", "number": 2, "episodeCount": 23 },
      { "name": "Season 3", "number": 3, "episodeCount": 12 }
    ],
    "currentSeason": { "name": "Season 2", "number": 2, "episodeCount": 23 },
    "episodes": [
      {
        "title": "Hidden Inventory",
        "number": "S2E1",
        "season": "Season 2",
        "seasonNumber": 2,
        "url": "...",
        "slug": "..."
      }
    ],
    "totalEpisodes": 23
  }
}
```
</details>

---

### 🔍 Search
```
GET /api/anime/search?q=naruto&page=1
```

| Query | Required | Description |
|-------|----------|-------------|
| `q` | ✅ yes | Search query |
| `page` | no | Page number |

---

### 🎭 By Genre
```
GET /api/anime/genre/:genre?page=1
```

**Example:** `/api/anime/genre/action?page=2`

> Use [`/api/genres`](#-genre-list) to get all available genre slugs.

---

### 🌐 By Language
```
GET /api/language/:lang?page=1
```

| Lang | Description |
|------|-------------|
| `hindi` | 🇮🇳 Hindi dubbed |
| `tamil` | 🇮🇳 Tamil dubbed |
| `telugu` | 🇮🇳 Telugu dubbed |
| `english` | 🇬🇧 English dubbed |
| `japanese` | 🇯🇵 Japanese (sub) |

**Example:** `/api/language/hindi?page=1`

---

### 🎪 Cartoons
```
GET /api/cartoons?page=1
```

---

### 🎬 Movies
```
GET /api/movies?page=1
```

---

### 📂 Genre List
```
GET /api/genres
```
Returns all available genre/category slugs.

---

### 🎯 Top Anime
```
GET /api/anime/top
```

---

### 📼 Episode Detail
```
GET /api/episode/:slug
```

---

### 📹 Video Extraction
```
GET /api/video?url=<episode_url>
GET /api/video/:slug
```

---

### ❤️ Health Check
```
GET /api/health
```

---

## 📄 Pagination

All list endpoints return a `pagination` object:

```json
{
  "currentPage": 2,
  "hasNextPage": true,
  "hasPrevPage": true,
  "totalPages": 10,
  "pages": [1, 2, 3, 4, 5, 10]
}
```

- Use `pages` array to render numbered page buttons `(1, 2, 3 … 10)`
- Use `hasNextPage` / `hasPrevPage` for NEXT / PREV buttons

---

## ⚡ Caching

All responses include a `cached: true/false` field. Cache TTLs:

| Endpoint | TTL |
|----------|-----|
| Home / Anime List | 5 minutes |
| Anime Detail | 10 minutes |
| Episode / Video | 10 minutes |
| Search | 2 minutes |

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Scraping:** Cheerio / Axios
- **Caching:** In-memory / Redis
- **Source:** [watchanimeworld.net](https://watchanimeworld.net)

---

## 👤 Author

**Abrar Fahim**

- GitHub: [@dev-abrarfahim](https://github.com/dev-abrarfahim)

---

## ⚠️ Disclaimer

This project is for **educational purposes only**. All content is scraped from [watchanimeworld.net](https://watchanimeworld.net). The author does not host or distribute any media files. Use responsibly and in accordance with applicable laws.

---

<div align="center">
Made with ❤️ by <a href="https://github.com/dev-abrarfahim">@dev-abrarfahim</a>
</div>
