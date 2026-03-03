//authRoutes.js

import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { signup, login } from "../controllers/authController.js";

const router = express.Router();

/* ================= LOCAL ================= */

router.post("/signup", signup);
router.post("/login", login);

/* ================= GENERIC SOCIAL HANDLER ================= */

const socialAuthHandler = async (req, res) => {
  const profile = req.user;

  const email =
    profile.emails?.[0]?.value ||
    profile._json?.mail ||
    profile._json?.userPrincipalName;

  if (!email) {
    return res.redirect("http://localhost:5173/?error=email_not_found");
  }

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name: profile.displayName,
      email,
      provider: profile.provider,
      providerId: profile.id,
    });
  }

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.redirect(`http://localhost:5173/oauth-success?token=${token}`);
};

/* ================= GOOGLE ================= */

router.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/google/callback",
  passport.authenticate("google", { session: false }),
  socialAuthHandler
);

/* ================= FACEBOOK ================= */

router.get("/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get("/facebook/callback",
  passport.authenticate("facebook", { session: false }),
  socialAuthHandler
);

/* ================= MICROSOFT ================= */

router.get("/microsoft",
  passport.authenticate("microsoft", { scope: ["user.read"] }),
);

router.get("/microsoft/callback",
  passport.authenticate("microsoft", { session: false }),
  socialAuthHandler
);

export default router;