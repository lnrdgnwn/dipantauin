import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthRepository } from "./auth.repository";

vi.mock("../../utils/jwt", () => ({
  generateTokens: vi.fn().mockResolvedValue({
    accessToken: "access-token",
    refreshToken: "refresh-token",
  }),
}));

import { AuthService, updateProfileSchema } from "./auth.service";

const activeUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "user@example.test",
  name: "User",
  passwordHash: "",
  role: "USER" as const,
  status: "ACTIVE" as const,
  isVerified: true,
  verificationCode: null,
  verificationCodeExpiresAt: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

describe("AuthService", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("signs in a verified active user with a valid password", async () => {
    const passwordHash = await bcrypt.hash("correct-password", 4);
    vi.spyOn(AuthRepository, "findUserByEmail").mockResolvedValue({
      ...activeUser,
      passwordHash,
    });
    vi.spyOn(AuthRepository, "findActiveSubscription").mockResolvedValue({
      id: "subscription-id",
    });

    const result = await AuthService.signIn({
      email: activeUser.email,
      password: "correct-password",
    });
    expect(result.user).not.toHaveProperty("passwordHash");
    expect(result.accessToken).toBe("access-token");
  });

  it.each([
    ["missing user", null, 401],
    ["suspended user", { ...activeUser, status: "SUSPENDED" as const }, 403],
    ["deleted user", { ...activeUser, status: "DELETED" as const }, 403],
  ])("rejects %s", async (_case, user, statusCode) => {
    vi.spyOn(AuthRepository, "findUserByEmail").mockResolvedValue(user);
    await expect(
      AuthService.signIn({ email: activeUser.email, password: "password" }),
    ).rejects.toMatchObject({ statusCode });
  });

  it("rejects a wrong password", async () => {
    vi.spyOn(AuthRepository, "findUserByEmail").mockResolvedValue({
      ...activeUser,
      passwordHash: await bcrypt.hash("correct-password", 4),
    });
    await expect(
      AuthService.signIn({
        email: activeUser.email,
        password: "wrong-password",
      }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("changes a password using a hash and revokes refresh sessions", async () => {
    const oldHash = await bcrypt.hash("old-password", 4);
    vi.spyOn(AuthRepository, "findCredentialsById").mockResolvedValue({
      id: activeUser.id,
      passwordHash: oldHash,
    });
    const update = vi
      .spyOn(AuthRepository, "updatePasswordAndRevokeSessions")
      .mockResolvedValue([] as never);

    await AuthService.changePassword(activeUser.id, {
      currentPassword: "old-password",
      newPassword: "new-password",
      confirmPassword: "new-password",
    });
    const newHash = update.mock.calls[0]?.[1];
    expect(newHash).not.toBe("new-password");
    expect(await bcrypt.compare("new-password", newHash)).toBe(true);
  });

  it("allows profile name only", () => {
    expect(updateProfileSchema.safeParse({ name: "Updated" }).success).toBe(true);
    expect(
      updateProfileSchema.safeParse({ name: "Updated", role: "ADMIN" }).success,
    ).toBe(false);
  });
});
