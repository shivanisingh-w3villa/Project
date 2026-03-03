//user.js


import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: String,

    provider: {
      type: String,
      enum: ["local", "google", "facebook", "microsoft"],
      default: "local",
    },

    providerId: String,

    /* ===== PROFILE EXTENSIONS ===== */

    profileImage: {
      type: String,
    },

    address: {
      type: String,
    },

    location: {
      lat: {
        type: Number,
      },
      lng: {
        type: Number,
      },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;