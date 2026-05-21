import app from "./app.ts";
import { logger } from "./lib/logger.ts";

const PORT = Number.parseInt(process.env.PORT ?? "5000", 10);

app.listen(PORT, () => {
  logger.info(
    { port: PORT, hasDatabaseUrl: Boolean(process.env.DATABASE_URL) },
    "api-server listening",
  );
});
