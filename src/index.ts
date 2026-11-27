import "reflect-metadata";
import Fastify from "fastify";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

import fastifyRateLimit from "@fastify/rate-limit";
import { AppDataSource } from "./data-source";
import { User } from "./entity/User";
import { authRoutes } from "./routes/auth";

const fastify = Fastify({ logger: true });

// Register rate limit plugin globally
fastify.register(fastifyRateLimit, {
  max: 100,
  timeWindow: "1 minute",
  errorResponseBuilder: (request, context) => {
    return {
      statusCode: 429,
      error: "Too Many Requests",
      message: `Rate limit exceeded. Maximum ${context.max} requests allowed per ${context.after}. Please try again later.`,
    };
  },
});

// Register auth routes
fastify.register(authRoutes);

// Health check route
fastify.get("/health", async () => {
  return { status: "ok", service: "identity-service", timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    // Initialize Database connection
    await AppDataSource.initialize();
    fastify.log.info("Database connected successfully.");

    // Backfill legacy users missing tenantId
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find();
    let backfilledCount = 0;
    for (const u of users) {
      if (!u.tenantId) {
        u.tenantId = crypto.randomUUID();
        await userRepository.save(u);
        backfilledCount++;
      }
    }
    if (backfilledCount > 0) {
      fastify.log.info(`Backfilled tenantId for ${backfilledCount} legacy user(s).`);
    }

    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const host = process.env.HOST || "0.0.0.0";

    await fastify.listen({ port, host });
    fastify.log.info(`Identity Service is running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
