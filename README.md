# Hindi Anime API

A scraper API for [watchanimeworld.net](https://watchanimeworld.net) — serving Hindi, Tamil, Telugu, English dubbed anime, cartoons, and movies.

## Setup

```bash
cp .env.example .env
npm install
npm run dev       # development
npm run build && npm start   # production
```

---

## API Endpoints

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
| `page` | number | 1 | Page number (pagination) |

**Response includes `pagination` object:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "hasNextPage": true,
    "hasPrevPage": false,
    "totalPages": 10,
    "pages": [1, 2, 3, 4, 5, 10]
  }
}
```

---

### 🎌 Anime Detail (with Season Support)
```
GET /api/anime/:slug
GET /api/anime/:slug?season=2
```
| Query | Type | Default | Description |
|-------|------|---------|-------------|
| `season` | number | latest | Filter episodes by season number |

**Response:**
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

---

### 🔍 Search
```
GET /api/anime/search?q=naruto&page=1
```
| Query | Required | Description |
|-------|----------|-------------|
| `q`   | ✅ yes   | Search query |
| `page`| no       | Page number |

---

### 🎭 By Genre
```
GET /api/anime/genre/:genre?page=1
```
Example: `/api/anime/genre/action?page=2`

---

### 🌐 By Language
```
GET /api/language/:lang?page=1
```
| Lang param | Description |
|------------|-------------|
| `hindi`    | Hindi dubbed |
| `tamil`    | Tamil dubbed |
| `telugu`   | Telugu dubbed |
| `english`  | English dubbed |
| `japanese` | Japanese (sub) |

Example: `/api/language/hindi?page=1`

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

## Pagination

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
Use `pages` array to render numbered page buttons (1, 2, 3 … 10) and `hasNextPage`/`hasPrevPage` for NEXT/PREV buttons.

---

## Caching

All responses include a `cached: true/false` field. Cache TTLs:
- Home / Anime List: 5 minutes
- Anime Detail: 10 minutes
- Episode / Video: 10 minutes
- Search: 2 minutes
