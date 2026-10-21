import fs from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('E:/dev/Q/node_modules/sharp');
const inputGif = 'E:/dev/Q-Social-Media-Manager/output/q-intelligence-intro.gif';
const outputAvi = 'E:/dev/Q-Social-Media-Manager/output/q-intelligence-intro-with-sound.avi';
const outputWav = 'E:/dev/Q-Social-Media-Manager/output/q-intelligence-intro-soundtrack.wav';
const fps = 10;
const sampleRate = 44100;
const channels = 2;
const frameCount = 70;
const seconds = frameCount / fps;

const fourcc = (s) => Buffer.from(s, 'ascii');
function chunk(id, data) {
  const out = Buffer.alloc(8 + data.length + (data.length & 1));
  fourcc(id).copy(out, 0);
  out.writeUInt32LE(data.length, 4);
  data.copy(out, 8);
  return out;
}
function list(type, ...children) {
  return chunk('LIST', Buffer.concat([fourcc(type), ...children]));
}
function streamHeader({ type, handler = '\0\0\0\0', scale, rate, length, bufferSize, sampleSize, width = 0, height = 0 }) {
  const b = Buffer.alloc(56);
  fourcc(type).copy(b, 0); fourcc(handler).copy(b, 4);
  b.writeUInt32LE(0, 8); b.writeUInt16LE(0, 12); b.writeUInt16LE(0, 14);
  b.writeUInt32LE(0, 16); b.writeUInt32LE(scale, 20); b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(0, 28); b.writeUInt32LE(length, 32); b.writeUInt32LE(bufferSize, 36);
  b.writeUInt32LE(0xffffffff, 40); b.writeUInt32LE(sampleSize, 44);
  b.writeInt16LE(0, 48); b.writeInt16LE(0, 50); b.writeInt16LE(width, 52); b.writeInt16LE(height, 54);
  return b;
}
function soundSample(t, freq, duration, amplitude, phase = 0) {
  const age = t - phase;
  if (age < 0 || age > duration) return 0;
  const attack = Math.min(1, age / 0.018);
  const decay = Math.exp(-age * 3.8);
  return amplitude * attack * decay * Math.sin(2 * Math.PI * freq * age);
}

// Make a quiet, warm ambient bed and three soft bell cues at the logo,
// title, and supporting line reveals (1.35 s, 2.15 s, and 2.85 s).
const totalSamples = Math.round(sampleRate * seconds);
const pcm = Buffer.alloc(totalSamples * channels * 2);
for (let i = 0; i < totalSamples; i++) {
  const t = i / sampleRate;
  const fadeIn = Math.min(1, t / 0.85);
  const fadeOut = Math.min(1, Math.max(0, (seconds - t) / 0.85));
  const bedEnv = 0.36 * fadeIn * fadeOut * (0.86 + 0.14 * Math.sin(2 * Math.PI * 0.16 * t));
  let sample = bedEnv * (0.020 * Math.sin(2 * Math.PI * 146.83 * t) + 0.015 * Math.sin(2 * Math.PI * 220 * t) + 0.010 * Math.sin(2 * Math.PI * 293.66 * t));
  sample += soundSample(t, 659.25, 0.85, 0.115, 1.32) + soundSample(t, 880, 0.85, 0.078, 1.32) + soundSample(t, 1318.51, 0.62, 0.036, 1.32);
  sample += soundSample(t, 523.25, 0.72, 0.095, 2.12) + soundSample(t, 659.25, 0.72, 0.074, 2.12) + soundSample(t, 783.99, 0.55, 0.032, 2.12);
  sample += soundSample(t, 783.99, 0.78, 0.076, 2.82) + soundSample(t, 987.77, 0.72, 0.052, 2.82) + soundSample(t, 1174.66, 0.55, 0.028, 2.82);
  sample = Math.max(-0.8, Math.min(0.8, sample));
  const int = Math.round(sample * 32767);
  const p = i * 4;
  pcm.writeInt16LE(int, p);
  pcm.writeInt16LE(Math.round(int * 0.985), p + 2);
}

const wav = Buffer.alloc(44 + pcm.length);
wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVE', 8);
wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(channels, 22); wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * channels * 2, 28); wav.writeUInt16LE(channels * 2, 32);
wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(pcm.length, 40); pcm.copy(wav, 44);
await fs.writeFile(outputWav, wav);

const frames = [];
let width = 0, height = 0, maxJpeg = 0;
for (let i = 0; i < frameCount; i++) {
  const frame = await sharp(inputGif, { page: i, pages: 1 }).jpeg({ quality: 86, chromaSubsampling: '4:2:0' }).toBuffer({ resolveWithObject: true });
  width = frame.info.width; height = frame.info.height;
  maxJpeg = Math.max(maxJpeg, frame.data.length);
  frames.push(frame.data);
}

const videoStrf = Buffer.alloc(40);
videoStrf.writeUInt32LE(40, 0); videoStrf.writeInt32LE(width, 4); videoStrf.writeInt32LE(height, 8);
videoStrf.writeUInt16LE(1, 12); videoStrf.writeUInt16LE(24, 14); fourcc('MJPG').copy(videoStrf, 16);
const audioStrf = Buffer.alloc(16);
audioStrf.writeUInt16LE(1, 0); audioStrf.writeUInt16LE(channels, 2); audioStrf.writeUInt32LE(sampleRate, 4);
audioStrf.writeUInt32LE(sampleRate * channels * 2, 8); audioStrf.writeUInt16LE(channels * 2, 12); audioStrf.writeUInt16LE(16, 14);

const videoList = list('strl', chunk('strh', streamHeader({ type: 'vids', handler: 'MJPG', scale: 1, rate: fps, length: frameCount, bufferSize: maxJpeg, sampleSize: 0, width, height })), chunk('strf', videoStrf));
const audioList = list('strl', chunk('strh', streamHeader({ type: 'auds', scale: channels * 2, rate: sampleRate * channels * 2, length: totalSamples, bufferSize: sampleRate * channels * 2 / fps, sampleSize: channels * 2 })), chunk('strf', audioStrf));
const avih = Buffer.alloc(56);
avih.writeUInt32LE(Math.round(1_000_000 / fps), 0);
avih.writeUInt32LE(Math.round((maxJpeg + sampleRate * channels * 2 / fps) * fps), 4);
avih.writeUInt32LE(0, 8); avih.writeUInt32LE(0x10, 12); avih.writeUInt32LE(frameCount, 16);
avih.writeUInt32LE(0, 20); avih.writeUInt32LE(2, 24); avih.writeUInt32LE(maxJpeg, 28);
avih.writeUInt32LE(width, 32); avih.writeUInt32LE(height, 36);
const header = list('hdrl', chunk('avih', avih), videoList, audioList);

const movieParts = [];
const indexParts = [];
let movieOffset = 4; // AVI idx1 offsets are relative to the movi list type field.
for (let i = 0; i < frameCount; i++) {
  const frameChunk = chunk('00dc', frames[i]);
  const sampleStart = Math.round(i * sampleRate / fps);
  const sampleEnd = Math.round((i + 1) * sampleRate / fps);
  const audioChunk = chunk('01wb', pcm.subarray(sampleStart * channels * 2, sampleEnd * channels * 2));
  movieParts.push(frameChunk, audioChunk);
  const frameIndex = Buffer.alloc(16);
  fourcc('00dc').copy(frameIndex, 0); frameIndex.writeUInt32LE(0x10, 4); frameIndex.writeUInt32LE(movieOffset, 8); frameIndex.writeUInt32LE(frames[i].length, 12);
  indexParts.push(frameIndex); movieOffset += frameChunk.length;
  const audioIndex = Buffer.alloc(16);
  fourcc('01wb').copy(audioIndex, 0); audioIndex.writeUInt32LE(0, 4); audioIndex.writeUInt32LE(movieOffset, 8); audioIndex.writeUInt32LE(audioChunk.readUInt32LE(4), 12);
  indexParts.push(audioIndex); movieOffset += audioChunk.length;
}
const movie = list('movi', ...movieParts);
const index = chunk('idx1', Buffer.concat(indexParts));
const aviPayload = Buffer.concat([fourcc('AVI '), header, movie, index]);
const avi = Buffer.alloc(8 + aviPayload.length);
fourcc('RIFF').copy(avi, 0); avi.writeUInt32LE(aviPayload.length, 4); aviPayload.copy(avi, 8);
await fs.writeFile(outputAvi, avi);
console.log(`Wrote ${outputAvi} (${width}x${height}, ${frameCount} frames, ${seconds}s, embedded PCM audio).`);
