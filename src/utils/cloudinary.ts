import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '#config/env';

if (config.cloudinary) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

export const uploadToCloudinary = async (
  source: Buffer | string,
): Promise<string> => {
  if (typeof source === 'string') {
    const fileBuffer = fs.readFileSync(source);
    return uploadBufferToCloudinary(fileBuffer);
  }
  return uploadBufferToCloudinary(source);
};

const uploadBufferToCloudinary = (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'tickets' },
      (error, result) => {
        if (error || !result) {
          return reject(error);
        }
        resolve(result.secure_url);
      },
    );

    stream.end(buffer);
  });
};
