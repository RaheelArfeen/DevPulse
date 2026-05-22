import app from "../src/app";
import { initDB } from "../src/db/index";

let dbReady: Promise<void> | null = null;
const warmup = () => {
  if (!dbReady) {
    dbReady = initDB();
  }
  return dbReady;
};

export default async function handler(
  req: Parameters<typeof app>[0],
  res: Parameters<typeof app>[1],
) {
  await warmup();
  return app(req, res);
}
