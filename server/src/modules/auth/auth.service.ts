import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users, sessions } from "../../db/schema.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { RegisterInput, LoginInput } from "./auth.schema.js";
import { env } from "../../config/env.js";
import { EmailService } from "../../services/email.service.js";
import { AppError } from "../../utils/ApiError.js";
import UserRepo from "../users/users.repository.js";
import PublicationRepo from "../publications/publications.repository.js";

const AuthService = {
  register: async (input: RegisterInput) => {
    const { email, password } = input;
    // Check if user already exists
    const existingUser = await UserRepo.getByEmail(email);
    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate a randome verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // crete user and publication in a transaction
    const newUser = await db.transaction(async (tx) => {
      const user = await UserRepo.create({email, passwordHash, verificationToken}, tx);
      if(!user?.id) {
        throw new AppError("Failed to create user record", 409);
      }

      const publication = await PublicationRepo.create(user.id, `${email.split("@")[0]}'s Publication`, tx);
      
      return {
        id: user?.id,
        email: user?.email,
        createdAt: user?.createdAt,
        publicationId: publication?.id,
      };
    })

    if (!newUser) {
      throw new AppError("Failed to create user record", 409);
    }
    // Send verification mail with token
    // EmailService.sendVerificationEmail(newUser?.email, verificationToken).catch(
    //   console.error,
    // );

    return newUser;
  },

  login: async (
    input: LoginInput,
    userAgent?: string,
    ipAddress?: string,
  ) => {
    const { email, password } = input;
    // Find user by email
    const user = await UserRepo.getByEmail(email);

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401);
    }
    // Generate token version for session management
    const tokenVersion = crypto.randomBytes(40).toString("hex");
    // Create Session
    const [session] = await db
      .insert(sessions)
      .values({
        userId: user.id,
        tokenVersion,
        userAgent,
        ipAddress,
      })
      .returning({
        id: sessions.id,
      });

    // Generate JWT tokens
    const accessToken = jwt.sign(
      {
        userId: user.id,
        sessionId: session?.id,
      },
      env.JWT_ACCESS_SECRET,
      {
        expiresIn: "15m",
      },
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        sessionId: session?.id,
        version: tokenVersion,
      },
      env.JWT_REFRESH_SECRET,
      {
        expiresIn: "7d",
      },
    );

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      accessToken,
      refreshToken,
    };
  },

  refreshToken: async (oldRefreshToken: string) => {
    try {
      // verify the old token
      const decoded = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET) as {
        userId: string;
        sessionId: string;
        version: string;
      };

      // Find the session in the database
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, decoded.sessionId))
        .limit(1);

      // Security Check: Token rotation & reuse detection
      if (
        !session ||
        !session.isValid ||
        session.tokenVersion !== decoded.version
      ) {
        // If a reused token is detected, invalidate ALL sessions for this user (Theft detection)
        if (session) {
          await db
            .update(sessions)
            .set({ isValid: false })
            .where(eq(sessions.userId, decoded.userId));
        }
        throw new AppError("Session is invalid old token was reused", 401);
      }

      // Generate a new token version string
      const nextTokenVersion = crypto.randomBytes(40).toString("hex");

      // Update the session in the database
      await db
        .update(sessions)
        .set({ tokenVersion: nextTokenVersion })
        .where(eq(sessions.id, session.id));

      // Mint new tokens
      const accessToken = jwt.sign(
        { userId: session.userId, sessionId: session.id },
        env.JWT_ACCESS_SECRET,
        { expiresIn: "15m" },
      );

      const newRefreshToken = jwt.sign(
        {
          userId: session.userId,
          sessionId: session.id,
          version: nextTokenVersion,
        },
        env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" },
      );

      return {
        accessToken,
        newRefreshToken,
      };
    } catch {
      throw new AppError("Invalid refresh token", 401);
    }
  },

  logout: async (sessionId: string) => {
    // Invalidate the session in the database
    await db
      .update(sessions)
      .set({ isValid: false })
      .where(eq(sessions.id, sessionId));
  },

  forgotPassword: async (email: string) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    // Security Best Practice: If user doesn't exist, we just return silently
    // This prevents malicious actors from "guessing" which emails are registered
    if (!user) return;

    // Generate new token and set expiry to 1 hour from now
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // save to db
    await db
      .update(users)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpires: tokenExpiry,
      })
      .where(eq(users.id, user.id));

    // Send password reset email
    EmailService.sendPasswordResetEmail(user.email, resetToken).catch(
      console.error,
    );
  },

  resetPassword: async (token: string, newPassword: string) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token))
      .limit(1);

    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      throw new AppError("Invallid or expired password reset token", 401);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await db
      .update(users)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      })
      .where(eq(users.id, user.id));

    // Invalidate all existing sessions here so the user is logged out everywhere
    await db
      .update(sessions)
      .set({ isValid: false })
      .where(eq(sessions.userId, user.id));
  }
}

export default AuthService;
