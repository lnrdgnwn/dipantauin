import bcrypt from "bcryptjs";
import { generateTokens } from "../../utils/jwt";
import { z } from "zod";
import crypto from "crypto";

import { email } from "../../config/email";
import { AuthRepository } from "./auth.repository";

export const signUpSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(255),
    email: z.string().trim().toLowerCase().email().max(255),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const signInSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(255),
    password: z.string().min(1).max(72),
  })
  .strict();

export const verifyEmailSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(255),
    code: z.string().regex(/^\d{6}$/),
  })
  .strict();

export const signOutSchema = z.object({
  refreshToken: z.string(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export const updateProfileSchema = z
  .object({ name: z.string().trim().min(1).max(255) })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(72),
    newPassword: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

function generateNameFromEmail(email: string): string {
  const localPart = email.split("@")[0] || "";
  return localPart
    .replace(/[._\-+]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export class AuthService {
  static async ensureFreePlan(userId: string) {
    const existingSub = await AuthRepository.findActiveSubscription(userId);

    if (!existingSub) {
      const freePlan = await AuthRepository.findFreePlan();
      if (freePlan) {
        const now = new Date();
        const periodEnd = new Date(Date.now() + 36500 * 24 * 60 * 60 * 1000); // 100 years
        await AuthRepository.createSubscription(
          userId,
          freePlan.id,
          now,
          periodEnd,
        );
      }
    }
  }

  static async signUp(data: z.infer<typeof signUpSchema>) {
    const existingUser = await AuthRepository.findUserByEmail(data.email);

    if (existingUser) {
      throw { statusCode: 409, message: "Email already registered" };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString(); // 6-digit code
    const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await AuthRepository.createUser({
      email: data.email,
      passwordHash,
      name: data.name,
      verificationCode,
      verificationCodeExpiresAt,
    });

    // Send the verification email
    await email.sendEmail({
      to: user.email,
      subject: "Verify your email address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Verify your email address</h2>
          <p>Hi ${user.name || "there"},</p>
          <p>Thanks for registering an account. Please use the following code to verify your email address:</p>
          <h1 style="letter-spacing: 4px; color: #333;">${verificationCode}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    });

    return {
      message:
        "User registered successfully. Please check your email to verify your account.",
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  static async signIn(data: z.infer<typeof signInSchema>) {
    const user = await AuthRepository.findUserByEmail(data.email);

    if (!user) {
      throw { statusCode: 401, message: "Invalid credentials" };
    }

    if (!user.isVerified) {
      throw { statusCode: 401, message: "Please verify your email first" };
    }

    if (user.status !== "ACTIVE") {
      throw { statusCode: 403, message: "Account is not active" };
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw { statusCode: 401, message: "Invalid credentials" };
    }

    await AuthService.ensureFreePlan(user.id);

    const { accessToken, refreshToken } = await generateTokens(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  static async verifyEmail(data: z.infer<typeof verifyEmailSchema>) {
    const user = await AuthRepository.findUserByEmail(data.email);

    if (!user) {
      throw { statusCode: 404, message: "User not found" };
    }

    if (user.isVerified) {
      throw { statusCode: 400, message: "User already verified" };
    }

    if (user.verificationCode !== data.code) {
      throw { statusCode: 400, message: "Invalid verification code" };
    }

    if (
      user.verificationCodeExpiresAt &&
      user.verificationCodeExpiresAt < new Date()
    ) {
      throw { statusCode: 400, message: "Verification code has expired" };
    }

    await AuthRepository.verifyUser(user.id);

    await AuthService.ensureFreePlan(user.id);

    const { accessToken, refreshToken } = await generateTokens(user.id);

    return {
      message: "Email verified successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: true,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  static async me(userId: string) {
    const user = await AuthRepository.findPublicUserById(userId);

    if (!user) {
      throw { statusCode: 404, message: "User not found" };
    }

    return user;
  }

  static updateProfile(
    userId: string,
    data: z.infer<typeof updateProfileSchema>,
  ) {
    return AuthRepository.updateProfile(userId, data);
  }

  static async changePassword(
    userId: string,
    data: z.infer<typeof changePasswordSchema>,
  ) {
    const user = await AuthRepository.findCredentialsById(userId);
    if (!user) throw { statusCode: 404, message: "User not found" };

    const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!valid) throw { statusCode: 400, message: "Current password is incorrect" };
    if (data.currentPassword === data.newPassword) {
      throw { statusCode: 400, message: "New password must be different" };
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 10);
    await AuthRepository.updatePasswordAndRevokeSessions(userId, passwordHash);
    return { message: "Password updated. Please sign in again." };
  }

  static async refreshAccessToken(refreshTokenValue: string) {
    if (!refreshTokenValue) {
      throw { statusCode: 401, message: "No refresh token provided" };
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshTokenValue)
      .digest("hex");

    const storedToken = await AuthRepository.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw { statusCode: 401, message: "Invalid or expired refresh token" };
    }

    if (storedToken.user.status !== "ACTIVE") {
      await AuthRepository.deleteRefreshToken(tokenHash);
      throw { statusCode: 403, message: "Account is not active" };
    }

    if (storedToken.expiresAt < new Date()) {
      await AuthRepository.deleteRefreshToken(tokenHash);
      throw { statusCode: 401, message: "Refresh token has expired" };
    }

    // Delete old refresh token (rotation)
    await AuthRepository.deleteRefreshToken(tokenHash);

    // Issue new token pair
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      storedToken.userId,
    );

    return {
      user: storedToken.user,
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async signOut(data: z.infer<typeof signOutSchema>) {
    const tokenHash = crypto
      .createHash("sha256")
      .update(data.refreshToken)
      .digest("hex");

    // We can either delete it or mark as revoked. Deleting is cleaner for basic usage.
    await AuthRepository.deleteRefreshToken(tokenHash);

    return { message: "Logged out successfully" };
  }
}
