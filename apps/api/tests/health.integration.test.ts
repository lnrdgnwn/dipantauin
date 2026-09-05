import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app";

describe("application middleware and health", () => {
  it("serves liveness without binding a network port", async () => {
    const response = await request(app).get("/api/health/live");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
    expect(response.headers["x-powered-by"]).toBeUndefined();
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("allows the configured credentialed CORS origin", async () => {
    const response = await request(app)
      .get("/api/health/live")
      .set("Origin", "http://localhost:3000");
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("does not grant CORS access to another origin", async () => {
    const response = await request(app)
      .get("/api/health/live")
      .set("Origin", "https://evil.example");
    expect(response.headers["access-control-allow-origin"]).not.toBe(
      "https://evil.example",
    );
  });

  it("rejects an unauthenticated protected route consistently", async () => {
    const response = await request(app).get("/api/tracked-products");
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      message: "Unauthorized",
    });
  });
});
