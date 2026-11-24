import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-identity-key-change-in-production";

interface RegisterBody {
  username: string;
  password: string;
  roles?: string[];
  claims?: Record<string, any>;
}

interface LoginBody {
  username: string;
  password: string;
}

export async function authRoutes(fastify: FastifyInstance) {
  const userRepository = AppDataSource.getRepository(User);

  // Register user
  fastify.post("/api/auth/register", {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "1 minute",
      },
    },
  }, async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    const { username, password, roles = ["user"], claims = {} } = request.body;

    if (!username || !password) {
      return reply.code(400).send({ error: "Username and password are required" });
    }

    const existingUser = await userRepository.findOneBy({ username });
    if (existingUser) {
      return reply.code(409).send({ error: "Username already exists" });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = new User();
    user.username = username;
    user.passwordHash = passwordHash;
    user.roles = roles;
    user.claimsJson = JSON.stringify(claims);

    await userRepository.save(user);

    return reply.code(201).send({
      message: "User registered successfully",
      userId: user.id,
      username: user.username,
      roles: user.roles,
      claims,
    });
  });

  // Login & issue access token with claims and roles incorporated
  fastify.post("/api/auth/login", {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "1 minute",
      },
    },
  }, async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      return reply.code(400).send({ error: "Username and password are required" });
    }

    const user = await userRepository.findOneBy({ username });
    if (!user) {
      return reply.code(401).send({ error: "Invalid username or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return reply.code(401).send({ error: "Invalid username or password" });
    }

    // Parse custom claims
    let customClaims = {};
    try {
      if (user.claimsJson) {
        customClaims = JSON.parse(user.claimsJson);
      }
    } catch (e) {
      customClaims = {};
    }

    // Build JWT payload incorporating user identity, roles, and claims
    const payload = {
      sub: user.id,
      username: user.username,
      roles: user.roles,
      ...customClaims,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    return {
      message: "Authentication successful",
      accessToken,
      tokenType: "Bearer",
      expiresIn: 3600,
    };
  });

  // Verify token and return decoded claims / user info
  fastify.get("/api/auth/verify", async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.code(401).send({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return { valid: true, decoded };
    } catch (err) {
      return reply.code(401).send({ valid: false, error: "Invalid or expired token" });
    }
  });
}
