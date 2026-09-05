import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";
import { env } from "../config/env";
import { AuthRepository } from "../modules/auth/auth.repository";
import { requireAdmin, requireAuth, type AuthRequest } from "./auth.middleware";

function responseDouble() {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  return response;
}

describe("authentication middleware", () => {
  it("rejects missing and invalid access tokens", () => {
    for (const cookies of [{}, { accessToken: "invalid" }]) {
      const response = responseDouble();
      requireAuth(
        { headers: {}, cookies } as unknown as AuthRequest,
        response as never,
        vi.fn(),
      );
      expect(response.statusCode).toBe(401);
      expect(response.body).toMatchObject({ success: false });
    }
  });

  it("attaches auth context from a valid cookie", () => {
    const userId = "11111111-1111-4111-8111-111111111111";
    const request = {
      headers: {},
      cookies: { accessToken: jwt.sign({ userId }, env.JWT_SECRET) },
    } as unknown as AuthRequest;
    const next = vi.fn();
    requireAuth(request, responseDouble() as never, next);
    expect(next).toHaveBeenCalledOnce();
    expect(request.user).toEqual({ userId, iat: expect.any(Number) });
  });

  it("allows an active ADMIN", async () => {
    vi.spyOn(AuthRepository, "findUserRole").mockResolvedValue({
      role: "ADMIN",
      status: "ACTIVE",
    });
    const token = jwt.sign(
      { userId: "11111111-1111-4111-8111-111111111111" },
      env.JWT_SECRET,
    );
    const next = vi.fn();
    requireAdmin(
      { headers: {}, cookies: { accessToken: token } } as unknown as AuthRequest,
      responseDouble() as never,
      next,
    );
    await vi.waitFor(() => expect(next).toHaveBeenCalledOnce());
  });
});
