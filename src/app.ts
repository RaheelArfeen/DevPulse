import cors from "cors";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import globalErrorHandler from "./middleware/globalErrorHandler";
import notFound from "./middleware/notFound";
import { authRoute } from "./modules/auth/auth.route";
import { issueRoute } from "./modules/issue/issue.route";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "DevPulse API is running",
  });
});

app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
