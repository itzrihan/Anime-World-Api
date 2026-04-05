app.get("/", (_req, res) => {
  res.json({
    message: "Welcome to the Web Scrape Bot API",
    version: "1.0.0",
    docs: "/api",
    health: "/api/healthz",
  });
});
