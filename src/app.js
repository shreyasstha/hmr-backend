import express from "express";
import cors from "cors";

import userRoutes from "./routes/user.route.js";
import authRoutes from "./routes/auth.route.js";
import referralRoutes from "./routes/referral.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import errorHandler from "./middlewares/errorHandler.middleware.js";

import { config } from "dotenv";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

const app = express();
config();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(bodyParser.json())

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the backend" });
});

// Register routes
app.use("/user", userRoutes);
app.use("/auth", authRoutes);
app.use("/dashboard", referralRoutes);
app.use("/main", dashboardRoutes);

app.use(errorHandler);

export default app;
