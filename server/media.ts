export async function loadPublishingImage(value: string, maximumBytes = 1000000) {
  let bytes: Buffer;
  let mime: string;
  const inline = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (inline) { mime = inline[1]; bytes = Buffer.from(inline[2], 'base64'); }
  else {
    const url = new URL(value);
    const allowed = new Set(['images.unsplash.com', 'brnhalxydcakutxiregp.supabase.co', ... (process.env.PUBLISHING_MEDIA_HOSTS || process.env.BLUESKY_MEDIA_HOSTS || '').split(',').map(v => v.trim()).filter(Boolean)]);
    if (url.protocol !== 'https:' || url.port || url.username || url.password || !allowed.has(url.hostname)) throw new Error('Publishing images must use PNG, JPEG or WebP uploads, or an approved media host.');
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error('Could not download an image for Bluesky.');
    mime = response.headers.get('content-type')?.split(';')[0] || '';
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime)) throw new Error('This upload supports PNG, JPEG and WebP images here; videos and SVG are not supported.');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Image download returned no content.');
    const chunks: Buffer[] = []; let size = 0;
    try { while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > maximumBytes) throw new Error('Each image must be within the selected platform upload limit.'); chunks.push(Buffer.from(value)); } }
    finally { await reader.cancel(); }
    bytes = Buffer.concat(chunks);
  }
  if (!bytes.length || bytes.length > maximumBytes) throw new Error('Each image must be within the selected platform upload limit.');
  return { bytes, mime };
}
