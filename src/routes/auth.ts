import { FastifyInstance } from "fastify";
import { registerHandler, loginHandler, verifyHandler } from "../handlers/auth.handler";

export async function authRoutes(fastify: FastifyInstance) {
  // Register user
  fastify.post("/api/auth/register", {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "1 minute",
      },
    },
  }, registerHandler);

  // Login & issue access token with claims and roles incorporated
  fastify.post("/api/auth/login", {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "1 minute",
      },
    },
  }, loginHandler);

  // Verify token and return decoded claims / user info
  fastify.get("/api/auth/verify", verifyHandler);
}
