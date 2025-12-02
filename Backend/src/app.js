import express from "express";
import cors from "cors";
const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// routes import
import sampleRouter from "./routes/sample.routes.js";

app.use("/", sampleRouter);

export { app };
