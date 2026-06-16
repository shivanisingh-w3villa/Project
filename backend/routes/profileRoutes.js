//profileRoutes.js

import express from "express";
import multer from "multer";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getProfile,
  updateAddress,
  uploadProfilePicture,
  downloadProfile,
  deleteProfile,
} from "../controllers/profileController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

const uploadProfileImage = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "Image must be 5MB or smaller"
          : error.message;

      return res.status(status).json({ message });
    }

    return res.status(400).json({ message: error.message });
  });
};

router.get("/", authMiddleware, getProfile);

router.put("/address", authMiddleware, updateAddress);

router.post(
  "/upload",
  authMiddleware,
  uploadProfileImage,
  uploadProfilePicture
);

router.get("/download", authMiddleware, downloadProfile);
router.delete("/", authMiddleware, deleteProfile);



export default router;
