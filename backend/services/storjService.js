import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const getStorjConfig = () => ({
  endpoint: process.env.STORJ_ENDPOINT || process.env.S3_ENDPOINT,
  accessKeyId: process.env.STORJ_ACCESS_KEY || process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.STORJ_SECRET_KEY || process.env.AWS_SECRET_KEY,
  bucket: process.env.STORJ_BUCKET || process.env.S3_BUCKET,
  region: process.env.AWS_REGION || "us-east-1",
  uploadPrefix: process.env.STORJ_UPLOAD_PREFIX ?? "profiles",
});

const validateStorjConfig = (config) => {
  const missing = Object.entries({
    STORJ_ENDPOINT: config.endpoint,
    STORJ_ACCESS_KEY: config.accessKeyId,
    STORJ_SECRET_KEY: config.secretAccessKey,
    STORJ_BUCKET: config.bucket,
  })
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    const error = new Error(`Missing Storj configuration: ${missing.join(", ")}`);
    error.statusCode = 503;
    throw error;
  }
};

const sanitizeFileName = (fileName = "profile-image") =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, "-");

const getObjectKey = (fileName, prefix) => {
  const cleanPrefix = prefix.replace(/^\/+|\/+$/g, "");
  const safeFileName = `${Date.now()}-${sanitizeFileName(fileName)}`;

  return cleanPrefix ? `${cleanPrefix}/${safeFileName}` : safeFileName;
};

const buildStorageError = (error, config) => {
  if (error?.Code === "AccessDenied" || error?.name === "AccessDenied") {
    const prefixMessage = config.uploadPrefix
      ? ` and prefix "${config.uploadPrefix}"`
      : "";
    const storageError = new Error(
      `Storage denied the upload. Check that the Storj/S3 key has write access to bucket "${config.bucket}"${prefixMessage}.`
    );
    storageError.statusCode = 502;
    return storageError;
  }

  return error;
};

export const uploadToStorj = async (file) => {
  const config = getStorjConfig();
  validateStorjConfig(config);

  if (!file?.buffer) {
    const error = new Error("No image file provided");
    error.statusCode = 400;
    throw error;
  }

  const s3 = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const key = getObjectKey(file.originalname, config.uploadPrefix);

  const params = {
    Bucket: config.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ContentLength: file.size,
  };

  try {
    await s3.send(new PutObjectCommand(params));
  } catch (error) {
    throw buildStorageError(error, config);
  }

  // create presigned URL for the uploaded file
  const presignedUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
    { expiresIn: parseInt(process.env.STORJ_URL_EXPIRY || "86400", 10) }
  );
  return presignedUrl;
};
