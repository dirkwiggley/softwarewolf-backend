import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../db.js";
import { signToken } from "../utils/jwt.js";

/**
 * Handles the secure identity resolution and cookie generation.
 */
export const login = async (req: Request, res: Response) => {
  /* Destructure the password parameter out of the incoming request body */
  const { username, password } = req.body;

  /* Ensure both credentials parameters are supplied by the client */
  if (!username || !password) {
    res
      .status(400)
      .json({ error: "Username and password parameters are required" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      res.status(401).json({ error: "Identity credentials not found" });
      return;
    }

    /* 3d. Validate the plain-text password input against the cryptographically hashed database string */
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ error: "Identity credentials not found" });
      return;
    }

    // Sign the JWT containing the structural parameters
    const token = signToken({
      userId: user.id,
      role: user.role,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
    });

    // Attach the JWT inside an HttpOnly cookie (Cross-subdomain configuration)
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: true, // Must be true for sameSite: "none" to work
      sameSite: "none", // Allows the cookie to be sent on cross-subdomain fetch requests
      // domain: ".softwarewolf.org", // Note the leading dot: enables sharing across all subdomains
      // maxAge removed so the browser discards this cookie automatically on closure
    });

    // Return the payload back to the client interface layout context
    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal system authentication pipeline error" });
  }
};

/**
 * Rehydrates active profile contexts or passes through guest definitions.
 */
export const getMe = async (req: Request, res: Response) => {
  // FIXED: Instead of throwing a 401 crash, return a clean 200 with user null
  // This allows the frontend framework to load smoothly without throwing a 500
  if (!req.user) {
    return res.status(200).json({ user: null, role: "GUEST" });
  }

  return res.status(200).json(req.user);
};

/**
 * Clears cookies on identity disconnect signals.
 */
export const logout = async (req: Request, res: Response) => {
  res.clearCookie("auth_token");
  res.json({ success: true, message: "Identity session terminated cleanly" });
};
