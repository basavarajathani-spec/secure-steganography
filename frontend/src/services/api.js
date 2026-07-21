import axios from "axios";

// All requests go through Vite's dev proxy at /api -> http://127.0.0.1:8000
// (see vite.config.js), so no CORS setup is needed in development.
const api = axios.create({
  baseURL: "https://secure-steganography-1.onrender.com",
});

/**
 * Encrypt a secret image and embed it into a cover video.
 * Returns { key_hex, sha256, download_url, stats }.
 */
export async function encryptAndEmbed(secretImageFile, coverVideoFile, onProgress) {
  const formData = new FormData();
  formData.append("secret_image", secretImageFile);
  formData.append("cover_video", coverVideoFile);

  const { data } = await api.post("/encrypt", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total));
      }
    },
  });
  return data;
}

/**
 * Extract + decrypt a stego video given the AES key.
 * Returns { image_url, integrity_ok, stats }.
 */
export async function decryptAndExtract(stegoVideoFile, keyHex, onProgress) {
  const formData = new FormData();
  formData.append("stego_video", stegoVideoFile);
  formData.append("key_hex", keyHex);

  const { data } = await api.post("/decrypt", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total));
      }
    },
  });
  return data;
}

export function fileUrl(path) {
  // Backend returns paths like "/files/xyz.avi" - prefix with /api for the proxy
  return  "https://secure-steganography-1.onrender.com${path}";
}

export default api;
