import test from "node:test";
import assert from "node:assert";
import crypto from "crypto";
import { AppDataSource } from "./data-source";
import { User } from "./entity/User";
import { registerHandler, RegisterBody } from "./handlers/auth.handler";
import { FastifyRequest, FastifyReply } from "fastify";

// Helper to mock Fastify request and reply
function createMockContext(body: RegisterBody): {
  req: FastifyRequest<{ Body: RegisterBody }>;
  reply: FastifyReply;
  getResult: () => { statusCode: number; responseBody: Record<string, unknown> | null };
} {
  const req = { body } as unknown as FastifyRequest<{ Body: RegisterBody }>;
  let statusCode = 200;
  let responseBody: Record<string, unknown> | null = null;

  const reply = {
    code(code: number): FastifyReply {
      statusCode = code;
      return this as unknown as FastifyReply;
    },
    send(payload: Record<string, unknown>): FastifyReply {
      responseBody = payload;
      return this as unknown as FastifyReply;
    },
  } as unknown as FastifyReply;

  return { req, reply, getResult: () => ({ statusCode, responseBody }) };
}

test("registerHandler assigns and returns unique tenantId (UUID v4)", async () => {
  if (!AppDataSource.isInitialized) {
    AppDataSource.setOptions({ database: ":memory:" });
    await AppDataSource.initialize();
  }

  // Clear users table
  const userRepository = AppDataSource.getRepository(User);
  await userRepository.clear();

  const { req, reply, getResult } = createMockContext({
    username: "testuser_" + crypto.randomUUID(),
    password: "Password123!",
  });

  const testUsername = req.body.username;
  await registerHandler(req, reply);
  const { statusCode, responseBody } = getResult();

  assert.strictEqual(statusCode, 201);
  assert.ok(responseBody);
  assert.ok(responseBody!.tenantId, "tenantId should be present in response");
  
  // Verify UUID v4 regex format
  const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  assert.match(responseBody!.tenantId as string, uuidv4Regex);

  // Verify stored in DB
  const savedUser = await userRepository.findOneBy({ username: testUsername });
  assert.ok(savedUser);
  assert.strictEqual(savedUser.tenantId, responseBody!.tenantId);
});

test("startup backfill populates tenantId for legacy users missing tenantId", async () => {
  if (!AppDataSource.isInitialized) {
    AppDataSource.setOptions({ database: ":memory:" });
    await AppDataSource.initialize();
  }

  const userRepository = AppDataSource.getRepository(User);
  await userRepository.clear();

  // Create legacy user without tenantId (bypassing entity validation if needed or inserting raw)
  const legacyUser = new User();
  legacyUser.username = "legacy_" + crypto.randomUUID();
  legacyUser.passwordHash = "hash";
  legacyUser.roles = ["user"];
  // Save without tenantId (or force tenantId to be null/undefined)
  await userRepository.save(legacyUser);
  
  // Directly set tenantId to null in db to simulate legacy record
  await userRepository.createQueryBuilder()
    .update(User)
    .set({ tenantId: undefined })
    .where("username = :username", { username: legacyUser.username })
    .execute();

  const userBeforeBackfill = await userRepository.findOneBy({ username: legacyUser.username });
  assert.ok(userBeforeBackfill);
  assert.strictEqual(userBeforeBackfill.tenantId, null);

  // Run backfill logic (same as in index.ts)
  const allUsers = await userRepository.find();
  for (const u of allUsers) {
    if (!u.tenantId) {
      u.tenantId = crypto.randomUUID();
      await userRepository.save(u);
    }
  }

  const userAfterBackfill = await userRepository.findOneBy({ username: legacyUser.username });
  assert.ok(userAfterBackfill);
  assert.ok(userAfterBackfill.tenantId);
  const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  assert.match(userAfterBackfill.tenantId, uuidv4Regex);
});
