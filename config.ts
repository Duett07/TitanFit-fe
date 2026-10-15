import { z } from "zod";

const configSchema = z.object({
  NEXT_PUBLIC_API_ENDPOINT: z.string().default("http://localhost:8080"),
});

const config = configSchema.safeParse({
  NEXT_PUBLIC_API_ENDPOINT:
    process.env.NEXT_PUBLIC_API_ENDPOINT ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_API_URL ||
    "http://localhost:8080",
});

if (!config.success) {
  console.error("Config validation error:", config.error.issues);
  throw new Error("All values declare in env not valid");
}

const envConfig = config.data;

export default envConfig;
