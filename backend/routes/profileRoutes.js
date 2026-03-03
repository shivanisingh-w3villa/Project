import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getProfile,
  updateAddress,
  uploadProfilePicture,
  downloadProfile,
} from "../controllers/profileController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getProfile);

router.put("/address", authMiddleware, updateAddress);

router.post(
  "/upload",
  authMiddleware,
  upload.single("image"),
  uploadProfilePicture
);

router.get("/download", authMiddleware, downloadProfile);

export default router;