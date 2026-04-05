# Hindi Anime API

> A powerful scraper API for [watchanimeworld.net](https://watchanimeworld.net) — serving Hindi, Tamil, Telugu, English dubbed anime, cartoons, and movies.

<div align="center">

[![Made with Node.js](https://img.shields.io/badge/Made%20with-Node.js-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

</div>

---

## 👨‍💻 Credits

**This project is created and maintained by:**

### [dev-abrarfahim](https://github.com/dev-abrarfahim)

<div align="center">
  
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github)](https://github.com/dev-abrarfahim)
[![Portfolio](https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=vercel)](https://dev-abrarfahim.vercel.app/)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter)](https://x.com/dev_abrarfahim)

</div>

---

## 🚀 Setup

```bash
# Clone the repository
git clone https://github.com/dev-abrarfahim/hindi-anime-api

# Navigate to project directory
cd hindi-anime-api

# Copy environment variables
cp .env.example .env

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build && npm start

📚 API Endpoints
🏠 Home
text

GET /api/home

Returns featured, latest episodes, trending, and recently updated content.
📺 Anime List
text

GET /api/anime?page=1

Query	Type	Default	Description
page	number	1	Page number (pagination)

Response includes pagination object:
json

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

🎌 Anime Detail (with Season Support)
text

GET /api/anime/:slug
GET /api/anime/:slug?season=2

Query	Type	Default	Description
season	number	latest	Filter episodes by season number

Response:
json

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

🔍 Search
text

GET /api/anime/search?q=naruto&page=1

Query	Required	Description
q	✅ yes	Search query
page	no	Page number
🎭 By Genre
text

GET /api/anime/genre/:genre?page=1

Example: /api/anime/genre/action?page=2
🌐 By Language
text

GET /api/language/:lang?page=1

Lang param	Description
hindi	Hindi dubbed
tamil	Tamil dubbed
telugu	Telugu dubbed
english	English dubbed
japanese	Japanese (sub)

Example: /api/language/hindi?page=1
🎪 Cartoons
text

GET /api/cartoons?page=1

🎬 Movies
text

GET /api/movies?page=1

📂 Genre List
text

GET /api/genres

Returns all available genre/category slugs.
🎯 Top Anime
text

GET /api/anime/top

📼 Episode Detail
text

GET /api/episode/:slug

📹 Video Extraction
text

GET /api/video?url=<episode_url>
GET /api/video/:slug

❤️ Health Check
text

GET /api/health

📄 Pagination

All list endpoints return a pagination object:
json

{
  "currentPage": 2,
  "hasNextPage": true,
  "hasPrevPage": true,
  "totalPages": 10,
  "pages": [1, 2, 3, 4, 5, 10]
}

Use pages array to render numbered page buttons (1, 2, 3 … 10) and hasNextPage/hasPrevPage for NEXT/PREV buttons.
⚡ Caching

All responses include a cached: true/false field. Cache TTLs:

    Home / Anime List: 5 minutes

    Anime Detail: 10 minutes

    Episode / Video: 10 minutes

    Search: 2 minutes

🤝 Contributing

Contributions are welcome! Feel free to:

    Fork the repository

    Create your feature branch (git checkout -b feature/AmazingFeature)

    Commit your changes (git commit -m 'Add some AmazingFeature')

    Push to the branch (git push origin feature/AmazingFeature)

    Open a Pull Request

📞 Support & Contact
<div align="center">

Created with ❤️ by dev-abrarfahim

https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github
https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter
</div>
📜 License

This project is licensed under the MIT License - see the LICENSE file for details.
<div align="center">

⭐ Star this repository if you find it useful!
</div> ```
