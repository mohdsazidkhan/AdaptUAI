import crypto from 'crypto';

/**
 * Upload an image (data URL or remote URL) to Cloudinary with a signed REST call.
 * No SDK needed: sign the params with the API secret and POST them.
 * @returns {Promise<{secure_url: string}>}
 */
export async function uploadImage(file, folder = 'adaptuai') {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary is not configured');

  const timestamp = Math.floor(Date.now() / 1000);
  // Signature = sha1 of the alphabetically sorted params (excluding file/api_key) + secret.
  const signature = crypto
    .createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);
  form.append('timestamp', String(timestamp));
  form.append('api_key', apiKey);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.secure_url) throw new Error(data?.error?.message || `Cloudinary upload failed (${res.status})`);
  return data;
}
