import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";

// validate essential environment variables at startup
const requiredVars = [
  "STORJ_ENDPOINT",
  "STORJ_ACCESS_KEY",
  "STORJ_SECRET_KEY",
  "STORJ_BUCKET",
];
requiredVars.forEach((v) => {
  if (!process.env[v]) {
    console.warn(`⚠️ Missing environment variable: ${v}`);
  }
});
// optionally log presigned url expiry setting
console.log(
  `Storj URL expiry seconds: ${process.env.STORJ_URL_EXPIRY || "86400"}`
);

const s3 = new S3Client({
  endpoint: process.env.STORJ_ENDPOINT,
  region: "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.STORJ_ACCESS_KEY || "",
    secretAccessKey: process.env.STORJ_SECRET_KEY || "",
  },
});

export const uploadToStorj = async (file) => {

  const fileBuffer = fs.readFileSync(file.path);

  const key = `profiles/${Date.now()}-${file.originalname}`;

  const params = {
    Bucket: process.env.STORJ_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: file.mimetype,
    ContentLength: fileBuffer.length
  };

  await s3.send(new PutObjectCommand(params));

  fs.unlinkSync(file.path);

  // create presigned URL for the uploaded file
  const presignedUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: process.env.STORJ_BUCKET,
      Key: key,
    }),
    { expiresIn: parseInt(process.env.STORJ_URL_EXPIRY || "86400", 10) }
  );
  return presignedUrl;
};