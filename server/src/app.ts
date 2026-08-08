import express, { Request, Response, Express } from "express";
import cookieParser from "cookie-parser";
import { httpLogger } from "./middlewares/httpLogger.js";
import { errorHandler } from "./middlewares/errorHandler.js";

import authRoutes from "./modules/auth/auth.route.js";

const app: Express = express();

app.use(httpLogger);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "welcome to auth starter",
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "Success",
    message: "Server is healthy",
  });
});

// use global error handler
app.use(errorHandler);

export default app;
