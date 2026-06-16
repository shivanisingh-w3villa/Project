// filepath: backend/controllers/paymentController.js
import Stripe from "stripe";
import User from "../models/user.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const getFrontendBaseUrl = () => {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL.split(",")[0].trim();
  }

  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  return "http://localhost:5173";
};

const buildCheckoutLineItem = (plan) => {
  if (typeof plan.stripePriceId === "string" && plan.stripePriceId.startsWith("price_")) {
    return {
      price: plan.stripePriceId,
      quantity: 1,
    };
  }

  return {
    price_data: {
      currency: "usd",
      product_data: {
        name: `${plan.name} Plan`,
      },
      unit_amount: plan.price,
    },
    quantity: 1,
  };
};

// Pricing plans configuration
export const PLANS = {
  free: { 
    name: "Free", 
    price: 0, 
    duration: null,
    stripePriceId: null 
  },
  silver: { 
    name: "Silver", 
    price: 999, // $9.99 in cents
    duration: 1 * 60 * 60 * 1000, // 1 hour
    stripePriceId: process.env.STRIPE_PRICE_ID_SILVER || "price_silver_test"
  },
  gold: { 
    name: "Gold", 
    price: 1999, // $19.99 in cents
    duration: 6 * 60 * 60 * 1000, // 6 hours
    stripePriceId: process.env.STRIPE_PRICE_ID_GOLD || "price_gold_test"
  },
};

const getPlanExpirationFromStart = (planId, startedAt = new Date()) => {
  const plan = PLANS[planId];
  if (!plan?.duration) {
    return null;
  }

  return new Date(startedAt.getTime() + plan.duration);
};

const activatePaidPlanForUser = async (userId, planId, activatedAt = new Date()) => {
  const plan = PLANS[planId];
  if (!plan) {
    throw new Error(`Invalid plan: ${planId}`);
  }

  const expiration = getPlanExpirationFromStart(planId, activatedAt);
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      plan: planId,
      planExpiration: expiration,
      planActivatedAt: activatedAt,
      planStatus: "active",
      pendingPlan: null,
      paymentCompletedAt: activatedAt,
    },
    { returnDocument: "after" }
  );

  return { updatedUser, expiration };
};

/**
 * Create a checkout session for Stripe payment
 * POST /payment/create-checkout-session
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (!planId) {
      return res.status(400).json({ 
        error: "Missing planId" 
      });
    }

    const plan = PLANS[planId];
    if (!plan) {
      return res.status(400).json({ 
        error: "Invalid plan" 
      });
    }

    // Free plan doesn't require payment
    if (planId === "free") {
      return res.status(400).json({ 
        error: "Free plan cannot be purchased through Stripe" 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        error: "User not found" 
      });
    }

    // Create Stripe checkout session
    const frontendBaseUrl = getFrontendBaseUrl();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      client_reference_id: userId,
      customer_email: user.email,
      line_items: [buildCheckoutLineItem(plan)],
      success_url: `${frontendBaseUrl}/payment/success?sessionId={CHECKOUT_SESSION_ID}&planId=${planId}`,
      cancel_url: `${frontendBaseUrl}/payment/cancel`,
      metadata: {
        userId,
        planId,
      },
    });

    res.json({ 
      success: true, 
      url: session.url,
    });
  } catch (error) {
    console.error("Checkout session creation error:", error);
    res.status(500).json({ 
      error: error.message || "Failed to create checkout session" 
    });
  }
};

/**
 * Handle Stripe webhook events
 * POST /payment/webhook
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody || req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(event.data.object);
      break;
    case "charge.refunded":
      await handleChargeRefunded(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

/**
 * Handle successful checkout session
 */
const handleCheckoutSessionCompleted = async (session) => {
  const userId = session.metadata.userId;
  const planId = session.metadata.planId;

  if (!userId || !planId) {
    console.error("Missing userId or planId in session metadata");
    return;
  }

  try {
    const activatedAt = new Date();
    const { updatedUser, expiration } = await activatePaidPlanForUser(
      userId,
      planId,
      activatedAt
    );

    if (!updatedUser) {
      console.error(`User not found for paid plan activation: ${userId}`);
      return;
    }

    console.log(`Plan ${planId} activated for user ${userId}`);
    console.log(`Plan expires at: ${expiration}`);

    // Could send confirmation email here
  } catch (error) {
    console.error("Error updating user plan:", error);
  }
};

/**
 * Handle successful payment intent
 */
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  console.log(`Payment succeeded: ${paymentIntent.id}`);
  // Additional logging or tracking can be done here
};

/**
 * Handle refunded charge
 */
const handleChargeRefunded = async (charge) => {
  console.log(`Charge refunded: ${charge.id}`);
  // Could downgrade user plan or handle refund logic here
};

/**
 * Retrieve checkout session status
 * GET /payment/checkout-session/:sessionId
 */
export const getCheckoutSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const sessionPlanId = session.metadata?.planId;
    const sessionUserId = session.metadata?.userId;
    let activatedPlan = false;

    if (session.payment_status === "paid" && sessionPlanId && sessionUserId) {
      const existingUser = await User.findById(sessionUserId).select(
        "plan planStatus planExpiration"
      );

      const shouldActivatePlan =
        existingUser &&
        (existingUser.plan !== sessionPlanId ||
          existingUser.planStatus !== "active" ||
          !existingUser.planExpiration);

      if (shouldActivatePlan) {
        const { updatedUser } = await activatePaidPlanForUser(
          sessionUserId,
          sessionPlanId,
          new Date()
        );
        activatedPlan = Boolean(updatedUser);
      }
    }

    res.json({
      success: true,
      sessionId: session.id,
      paymentStatus: session.payment_status,
      customerId: session.customer_details?.email,
      planId: sessionPlanId,
      userId: sessionUserId,
      activatedPlan,
    });
  } catch (error) {
    console.error("Error retrieving checkout session:", error);
    res.status(500).json({ 
      error: error.message || "Failed to retrieve session" 
    });
  }
};

/**
 * Activate free plan (no payment required)
 * POST /payment/activate-free
 */
export const activateFreePlan = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        plan: "free",
        planExpiration: null,
        planActivatedAt: null,
        planStatus: "active",
        pendingPlan: null,
        paymentCompletedAt: null,
      },
      { returnDocument: "after" }
    );

    if (!updatedUser) {
      return res.status(404).json({ 
        error: "User not found" 
      });
    }

    res.json({
      success: true,
      message: "Free plan activated",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Plan activation error:", error);
    res.status(500).json({ 
      error: error.message || "Failed to activate plan" 
    });
  }
};

/**
 * Get current user's plan status
 * GET /payment/plan-status/:userId
 */
export const getPlanStatus = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const user = await User.findById(userId).select(
      "plan planExpiration planStatus pendingPlan paymentCompletedAt planActivatedAt"
    );

    if (!user) {
      return res.status(404).json({ 
        error: "User not found" 
      });
    }

    const now = new Date();
    let remainingTime = 0;
    let isExpired = false;

    // Check if plan has expired
    if (user.planExpiration && now > user.planExpiration) {
      // Plan has expired, mark as expired
      user.plan = "free";
      user.planExpiration = null;
      user.planActivatedAt = null;
      user.planStatus = "expired";
      isExpired = true;
      await user.save();
    } else if (user.planExpiration && user.plan !== "free") {
      // Calculate remaining time in milliseconds
      remainingTime = user.planExpiration.getTime() - now.getTime();
    }

    res.json({
      plan: user.plan,
      pendingPlan: user.pendingPlan,
      expiration: user.planExpiration,
      activatedAt: user.planActivatedAt,
      paymentCompletedAt: user.paymentCompletedAt,
      status: user.planStatus,
      remainingTime: remainingTime > 0 ? remainingTime : 0,
      isExpired: isExpired,
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message || "Failed to fetch plan status" 
    });
  }
};

/**
 * Get available plans
 * GET /payment/plans
 */
export const getPlans = async (req, res) => {
  try {
    const plansData = Object.entries(PLANS).map(([id, plan]) => ({
      id,
      name: plan.name,
      price: plan.price / 100, // Convert cents to dollars
      displayPrice: plan.price === 0 ? "Free" : `$${(plan.price / 100).toFixed(2)}`,
      duration: plan.duration ? `${plan.duration / (60 * 60 * 1000)} hours` : "Unlimited",
      stripePriceId: plan.stripePriceId,
    }));

    res.json({
      success: true,
      plans: plansData,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message || "Failed to fetch plans" 
    });
  }
};

export const activateQueuedPlan = async (user) => {
  const planId = user.pendingPlan;
  const plan = PLANS[planId];

  if (!plan) {
    throw new Error(`Invalid pending plan: ${planId}`);
  }

  const activatedAt = new Date();
  user.plan = planId;
  user.planActivatedAt = activatedAt;
  user.planExpiration = getPlanExpirationFromStart(planId, activatedAt);
  user.planStatus = "active";
  user.pendingPlan = null;
  await user.save();

  return user;
};
