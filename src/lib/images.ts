import { uid } from './format';
import type { ReferencePhoto } from '../data/types';

export const MAX_REFERENCE_PHOTOS = 6;
const MAX_EDGE = 1400;

/** Reads an image file, downscales it to fit MAX_EDGE, and returns a JPEG data URL. */
export async function fileToReferencePhoto(file: File): Promise<ReferencePhoto> {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image`);
  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(bitmapUrl);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return { id: uid('ref_'), name: file.name, dataUrl: canvas.toDataURL('image/jpeg', 0.82) };
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that image'));
    img.src = src;
  });
}
