// src/services/cloudinaryService.js
const CLOUD_NAME    = 'dx9aiam29';
const UPLOAD_PRESET = 'hammerradio';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB Cloudinary free tier limit

function imageMime(ext) {
  return ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
}
function audioMime(ext) {
  return ext === 'm4a' ? 'audio/m4a' : ext === 'mp3' ? 'audio/mpeg' : 'audio/aac';
}
function videoMime(ext) {
  return ext === 'mov' ? 'video/quicktime' : ext === 'avi' ? 'video/x-msvideo' : 'video/mp4';
}

async function _upload(uri, resourceType, mimeType, timeoutMs = 120000) {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const filename = uri.split('/').pop();
    const form = new FormData();
    form.append('file', { uri, type: mimeType, name: filename });
    form.append('upload_preset', UPLOAD_PRESET);
    form.append('resource_type', resourceType);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
      { method: 'POST', body: form, signal: controller.signal }
    );
    const data = await res.json();
    if (data.secure_url) return data.secure_url;
    throw new Error(data.error?.message || 'Upload failed');
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error('Upload timed out. Check your connection or try a shorter/smaller video.');
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function uploadImage(uri) {
  const ext = uri.split('.').pop().toLowerCase();
  return _upload(uri, 'image', imageMime(ext), 60000); // 1 min
}

export async function uploadAudio(uri) {
  const ext = uri.split('.').pop().toLowerCase();
  return _upload(uri, 'video', audioMime(ext), 120000); // 2 min
}

export async function uploadVideo(uri, fileSize) {
  if (fileSize && fileSize > MAX_VIDEO_BYTES) {
    const mb = (fileSize / 1024 / 1024).toFixed(1);
    throw new Error(
      `Video is too large (${mb}MB). Maximum size is 100MB. Please trim the video or choose a shorter clip.`
    );
  }
  const ext = uri.split('.').pop().toLowerCase();
  return _upload(uri, 'video', videoMime(ext), 300000); // 5 min
}