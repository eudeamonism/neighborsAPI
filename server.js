import express from "express";
import dotenv from "dotenv/config";
import { connectToDatabase } from "./database.js";
import userRoutes from "./routes/userRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import cors from "cors";
import AppError from "./appError.js";
import globalError from "./errorController.js";

const app = express();
const port = process.env.PORT || 5000;
const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";
connectToDatabase();

//Global Middleware
app.use(express.json());

/* app.use((req, res, next) => {
  console.log("Global middleware");
  next();
}); */

// Add CORS headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTURL);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  next();
});

//Routes
app.use("/api/users", userRoutes);
app.use("/api/complaint", complaintRoutes);

app.all("*", (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server.`);
  err.status = "fail";
  err.statusCode = 404;

  next(err);
});

app.use(globalError);
app.use(cors());

const server = app.listen(port, () => {
  if (isDev) {
    console.log(`Server listening on ${port}: development`);
  } else if (isProd) {
    console.log("The server is on! production!");
  }
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION! Shutting down...");
  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  process.exit(1);
});
