import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

const configSchema = z.object({
  NEXT_PUBLIC_API_ENDPOINT: isProduction
    ? z
        .string()
        .min(1, "NEXT_PUBLIC_API_ENDPOINT cannot be empty in production")
        .url("NEXT_PUBLIC_API_ENDPOINT must be a valid URL")
    : z.string().url().default("http://localhost:8080"),
});

const config = configSchema.safeParse({
  NEXT_PUBLIC_API_ENDPOINT:
    process.env.NEXT_PUBLIC_API_ENDPOINT || (!isProduction ? "http://localhost:8080" : undefined),
});

if (!config.success) {
  console.error("Config validation error:", config.error.issues);
  throw new Error("Missing or invalid NEXT_PUBLIC_API_ENDPOINT environment configuration");
}

const envConfig = config.data;

export default envConfig;
