
export function hasVercelBlob() {
  try {
    return !!process.env.BLOB_READ_WRITE_TOKEN || !!process.env.VERCEL_BLOB_STORE_ID;
  } catch (e) {
    return false;
  }
}

export async function uploadToVercelBlob(name, buffer, contentType) {
  const { upload } = await import('@vercel/blob');
  const res = await upload(name, buffer, { contentType });
  return res;
}

export async function presignVercelBlob(key) {
  if (!key) return null;
  if (typeof key === 'string' && key.startsWith('http')) return key;
  return key.url || key;
}
