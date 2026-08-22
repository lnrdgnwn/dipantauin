import bcrypt from "bcryptjs";
import {prisma} from "@dipantauin/prisma";
import { generateTokens } from "../../utils/jwt";
import { z } from "zod";
import crypto from "crypto";

import { email } from "../../config/email";

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export const signOutSchema = z.object({
  refreshToken: z.string(),
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
    const existingSub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["ACTIVE"] },
      },
    });

    if (!existingSub) {
      const freePlan = await prisma.plan.findFirst({
        where: { code: "FREE", isActive: true },
      });
      if (freePlan) {
        const now = new Date();
        const periodEnd = new Date(Date.now() + 36500 * 24 * 60 * 60 * 1000); // 100 years
        await prisma.subscription.create({
          data: {
            userId,
            planId: freePlan.id,
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
        });
      }
    }
  }

  static async signUp(data: z.infer<typeof signUpSchema>) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw { statusCode: 409, message: "Email already registered" };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const finalName = generateNameFromEmail(data.email);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: finalName,
        verificationCode,
        verificationCodeExpiresAt,
      },
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
      `
    });

    return {
      message: "User registered successfully. Please check your email to verify your account.",
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  static async signIn(data: z.infer<typeof signInSchema>) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw { statusCode: 401, message: "Invalid credentials" };
    }

    if (!user.isVerified) {
      throw { statusCode: 401, message: "Please verify your email first" };
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

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
      },
      accessToken,
      refreshToken,
    };
  }

  static async verifyEmail(data: z.infer<typeof verifyEmailSchema>) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw { statusCode: 404, message: "User not found" };
    }

    if (user.isVerified) {
      throw { statusCode: 400, message: "User already verified" };
    }

    if (user.verificationCode !== data.code) {
      throw { statusCode: 400, message: "Invalid verification code" };
    }

    if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt < new Date()) {
      throw { statusCode: 400, message: "Verification code has expired" };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
    });

    await AuthService.ensureFreePlan(user.id);

    const { accessToken, refreshToken } = await generateTokens(user.id);

    return {
      message: "Email verified successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  static async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw { statusCode: 404, message: "User not found" };
    }

    return user;
  }

  static async signOut(data: z.infer<typeof signOutSchema>) {
    const tokenHash = crypto.createHash("sha256").update(data.refreshToken).digest("hex");

    // We can either delete it or mark as revoked. Deleting is cleaner for basic usage.
    await prisma.refreshToken.deleteMany({
      where: { tokenHash },
    });

    return { message: "Logged out successfully" };
  }
}
