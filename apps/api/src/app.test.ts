import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import type { Express } from "express";

const shouldRun = Boolean(process.env.DATABASE_URL);

describe.runIf(shouldRun)("API smoke tests", () => {
  let app: Express;

  beforeAll(async () => {
    const mod = await import("./app.ts");
    app = mod.default;
  });

  it("GET /api/healthz returns 200", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: expect.any(String) });
  });

  it("GET /api/languages returns an array", async () => {
    const res = await request(app).get("/api/languages");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toMatchObject({
        id: expect.any(Number),
        slug: expect.any(String),
        name: expect.any(String),
      });
    }
  });

  it("GET /api/articles returns an array", async () => {
    const res = await request(app).get("/api/articles");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
