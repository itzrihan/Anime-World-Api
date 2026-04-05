import express from "express";
import cors from "cors";
import router from "./routes/index.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.json({
    message: "Welcome to the Web Scrape Bot API",
    version: "1.0.0",
    docs: "/api",
    health: "/api/healthz",
  });
});

app.use("/api", router);
export default app;
