import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";
import { AuthRepository } from "../modules/auth/auth.repository";

function getExpiresAtDate(expiresIn: string): Date {
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const value = parseInt(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    s: 1000,
  };

  return new Date(Date.now() + value * multipliers[unit]);
}

export const generateTokens = async (userId: string) => {
  const accessOptions: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as any };
  const accessToken = jwt.sign({ userId }, env.JWT_SECRET, accessOptions);

  const refreshOptions: SignOptions = {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as any,
  };
  const refreshToken = jwt.sign({ userId }, env.JWT_SECRET, refreshOptions);

  // Hash the refresh token before saving to database
  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");
  const expiresAt = getExpiresAtDate(env.REFRESH_TOKEN_EXPIRES_IN);

  await AuthRepository.createRefreshToken(userId, tokenHash, expiresAt);
  await AuthRepository.pruneRefreshTokens(userId);

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string): { userId: string } => {
  return jwt.verify(token, env.JWT_SECRET) as { userId: string };
};
