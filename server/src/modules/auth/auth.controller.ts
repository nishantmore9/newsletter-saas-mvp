import { Request, Response } from "express";
import  AuthService  from "./auth.service.js";
import { AuthRequest } from "../../middlewares/requireAuth.js";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { AppError } from "../../utils/ApiError.js";
import { getValidatedData } from "../../utils/validateData.js";
import {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  resetPasswordInput,
  ResetPasswordParamsInput,
  VerifyEmailParamsInput,
} from "./auth.schema.js";

export const resgister = async (req: Request, res: Response): Promise<void> => {
  const data = getValidatedData<RegisterInput>(req);
  const user = await AuthService.register(data);

  res.status(201).json({
    status: "success",
    data: { user },
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const userAgent = req.headers["user-agent"];
  const ipAddress = req.ip;
  const data = getValidatedData<LoginInput>(req);
  const { user, accessToken, refreshToken } = await AuthService.login(
    data,
    userAgent,
    ipAddress,
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    // secure: process.env.NODE_ENV === 'production',
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    status: "success",
    data: { user, accessToken },
  });
};

export const refreshHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new AppError("No refresh token provided", 401);
  }

  const { accessToken, newRefreshToken } = await AuthService.refreshToken(refreshToken);

  // set the NEW refresh token cookie
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    // secure : proccess.env.NODE_ENV === 'production',
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    status: "success",
    data: { accessToken },
  });
};

export const logout = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const sessionId = req.user?.sessionId;
  if (sessionId) {
    await AuthService.logout(sessionId);
  }

  res.clearCookie("refreshToken");
  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};

export const getProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  // This is a protected route. If we reach here, req.user is guaranteed to exist!
  res.status(200).json({
    status: "success",
    data: {
      userId: req.user?.userId,
      message: "You have accessed a protected route!",
    },
  });
};

export const verifyEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const data = getValidatedData<VerifyEmailParamsInput>(req);
  const { token } = data;

  if (!token) {
    throw new AppError("Verification token is required", 400);
  }

  // Find user with same token
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.verificationToken, token))
    .limit(1);

  if (!user) {
    throw new AppError("Invalid or expired verification token", 400);
  }

  // update user set verified true
  await db
    .update(users)
    .set({
      isVerified: true,
      verificationToken: null,
    })
    .where(eq(users.id, user.id));

  res.status(200).json({
    status: "success",
    message: "Email verified successfully!",
  });
};

export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const data = getValidatedData<ForgotPasswordInput>(req);
  const { email } = data;
  await AuthService.forgotPassword(email);

  res.status(200).json({
    status: "success",
    message:
      "If an account with that email exists, a reset link has been sent.",
  });
};

export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = getValidatedData<ResetPasswordParamsInput>(req);
  const body = getValidatedData<resetPasswordInput>(req);
  const { token } = params;
  const { newPassword } = body;

  await AuthService.resetPassword(token, newPassword);

  res.status(200).json({
    status: "success",
    message: "Password has been successfully reset. You can now log in.",
  });
};
