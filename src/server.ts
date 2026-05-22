import app from "./app";
import config from "./config/index";
import { initDB } from "./db/index";

const main = async () => {
  await initDB();

  app.listen(config.port, () => {
    console.log(`DevPulse API listening on port ${config.port}`);
  });
};

main();
