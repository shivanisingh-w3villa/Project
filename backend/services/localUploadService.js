import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const uploadsRoot = path.join(backendRoot, "uploads");
const profileUploadsDir = path.join(uploadsRoot, "profiles");

const sanitizeFileName = (fileName = "profile-image") =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, "-");

const getBaseUrl = (req) => {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/+$/g, "");
  }

  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  return `${protocol}://${req.get("host")}`;
};

export const uploadProfileImageLocally = async (file, req) => {
  if (!file?.buffer) {
    const error = new Error("No image file provided");
    error.statusCode = 400;
    throw error;
  }

  await fs.mkdir(profileUploadsDir, { recursive: true });

  const fileName = `${Date.now()}-${sanitizeFileName(file.originalname)}`;
  const filePath = path.join(profileUploadsDir, fileName);
  const publicPath = `/uploads/profiles/${fileName}`;

  await fs.writeFile(filePath, file.buffer);

  return `${getBaseUrl(req)}${publicPath}`;
};
