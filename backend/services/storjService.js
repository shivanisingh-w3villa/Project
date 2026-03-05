import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";

const s3 = new S3Client({
  endpoint: process.env.STORJ_ENDPOINT,
  region: "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.STORJ_ACCESS_KEY,
    secretAccessKey: process.env.STORJ_SECRET_KEY,
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

  return `https://link.storjshare.io/s/${process.env.STORJ_SHARE_TOKEN}/${process.env.STORJ_BUCKET}/${key}`;
};``