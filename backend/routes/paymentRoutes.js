// filepath: backend/routes/paymentRoutes.js
import express from "express";
import Stripe from "stripe";
import User from "../models/user.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Pricing plans configuration
const PLANS = {
  free: { name: "Free", price: 0, duration: null }, // No expiration
  silver: { name: "Silver", price: 9.99, duration: 1 * 60 * 60 * 1000 }, // 1 hour in ms
  gold: { name: "Gold", price: 29.99, duration: 6 * 60 * 60 * 1000 }, // 6 hours in ms
};

// Create payment intent
router.post("/create-payment-intent", async (req, res) => {
  try {
    const { userId, planId } = req.body;

    if (!PLANS[planId]) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const plan = PLANS[planId];

    if (plan.price === 0) {
      // Free plan - no payment needed
      const expiration = plan.duration ? new Date(Date.now() + plan.duration) : null;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          plan: planId,
          planExpiration: expiration,
          planStatus: "active",
        },
        { returnDocument: "after" }
      );

      return res.json({
        success: true,
        message: "Free plan activated",
        user: updatedUser,
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.price * 100), // Convert to cents
      currency: "usd",
      metadata: { userId, planId },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Payment intent error:", error);
    res.status(400).json({ error: error.message });
  }
});

// Confirm payment and update user
router.post("/confirm-payment", async (req, res) => {
  try {
    const { userId, planId, paymentIntentId } = req.body;

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      const plan = PLANS[planId];
      const expiration = plan.duration ? new Date(Date.now() + plan.duration) : null;

      // Update user plan
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          plan: planId,
          planExpiration: expiration,
          planStatus: "active",
        },
        { returnDocument: "after" }
      );

      res.json({
        success: true,
        message: "Payment successful",
        user: updatedUser,
      });
    } else {
      res.status(400).json({ error: "Payment not confirmed" });
    }
  } catch (error) {
    console.error("Payment confirmation error:", error);
    res.status(400).json({ error: error.message });
  }
});

// Get current user's plan status
router.get("/plan-status/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      "plan planExpiration planStatus"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if plan has expired
    if (user.planExpiration && new Date() > user.planExpiration) {
      user.planStatus = "expired";
      await user.save();
    }

    res.json({
      plan: user.plan,
      expiration: user.planExpiration,
      status: user.planStatus,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Webhook to handle async payment events
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
      const { metadata } = event.data.object;
      const { userId, planId } = metadata;

      const plan = PLANS[planId];
      const expiration = plan.duration ? new Date(Date.now() + plan.duration) : null;

      await User.findByIdAndUpdate(
        userId,
        {
          plan: planId,
          planExpiration: expiration,
          planStatus: "active",
        },
        { returnDocument: "after" }
      );
    }

    res.json({ received: true });
  }
);

export default router;