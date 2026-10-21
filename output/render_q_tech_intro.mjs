import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('E:/dev/Q/node_modules/sharp');
const logoPath = 'E:/dev/Q/public/logo.png';
const outDir = 'E:/dev/Q-Social-Media-Manager/output';
const frameDir = path.join(outDir, 'q-tech-frames');
const videoPath = path.join(outDir, 'q-intelligence-intro-with-sound.avi');
const wavPath = path.join(outDir, 'q-intelligence-intro-soundtrack.wav');
const width = 1280, height = 720, fps = 24, seconds = 7, frameCount = fps * seconds;
const sampleRate = 48000, channels = 2, totalSamples = sampleRate * seconds;
const clamp = (n) => Math.max(0, Math.min(1, n));
const smoother = (a, b, t) => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const easeOut = (x) => { x = clamp(x); return 1 - (1 - x) ** 3; };

await fs.mkdir(frameDir, { recursive: true });
const logo = await fs.readFile(logoPath);
const dots = Array.from({ length: 96 }, (_, i) => {
  const x = (i * 173 + 43) % width, y = (i * 97 + 31) % height;
  const r = i % 11 === 0 ? 2.1 : 1.1;
  const alpha = i % 7 === 0 ? 0.43 : 0.18;
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 3 === 0 ? '#67e8f9' : '#c4b5fd'}" opacity="${alpha}"/>`;
}).join('');
const gridX = Array.from({ length: 28 }, (_, i) => `<path d="M${i * 48} 0V720"/>`).join('');
const gridY = Array.from({ length: 16 }, (_, i) => `<path d="M0 ${i * 48}H1280"/>`).join('');
const logoBuf = await fs.readFile(logoPath);

for (let f = 0; f < frameCount; f++) {
  const t = f / fps;
  const orbital = smoother(0.18, 1.25, t);
  const logoIn = smoother(0.82, 1.55, t);
  const titleIn = smoother(1.83, 2.42, t);
  const lineIn = smoother(2.48, 3.08, t);
  const reveal = smoother(0.0, 1.4, t);
  const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2.0);
  const rot1 = t * 72 - 95, rot2 = -t * 54 + 22;
  const scanY = ((t * 230 + 14) % 720).toFixed(1);
  const logoScale = 0.91 + 0.09 * easeOut((t - .80) / .70) + (t > 1.55 ? .004 * Math.sin(t * Math.PI * 1.1) : 0);
  const logoSize = Math.round(258 * logoScale);
  const logoLeft = Math.round((width - logoSize) / 2);
  const logoTop = Math.round(104 + 22 * (1 - easeOut((t - .8) / .75)));
  const wordY = Math.round(462 + 18 * (1 - titleIn));
  const supportY = Math.round(520 + 13 * (1 - lineIn));
  const progress = clamp((t - .1) / 6.9);
  const orbitDotX = (640 + Math.cos(t * 1.25) * 214).toFixed(2);
  const orbitDotY = (263 + Math.sin(t * 1.25) * 92).toFixed(2);
  const hudOpacity = (0.28 + .10 * pulse).toFixed(3);
  const svg = `<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#020617"/><stop offset=".49" stop-color="#0b1024"/><stop offset="1" stop-color="#071b2a"/></linearGradient>
      <radialGradient id="core"><stop stop-color="#6d28d9" stop-opacity=".26"/><stop offset=".52" stop-color="#4c1d95" stop-opacity=".12"/><stop offset="1" stop-color="#020617" stop-opacity="0"/></radialGradient>
      <linearGradient id="cyanMagenta"><stop stop-color="#22d3ee" stop-opacity="0"/><stop offset=".5" stop-color="#67e8f9"/><stop offset="1" stop-color="#d946ef" stop-opacity="0"/></linearGradient>
      <linearGradient id="scan"><stop stop-color="#22d3ee" stop-opacity="0"/><stop offset=".5" stop-color="#a5f3fc" stop-opacity=".7"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></linearGradient>
      <filter id="bloom"><feGaussianBlur stdDeviation="30"/></filter>
      <filter id="shine"><feGaussianBlur stdDeviation="7" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="scanblur"><feGaussianBlur stdDeviation="8"/></filter>
    </defs>
    <rect width="1280" height="720" fill="url(#bg)"/>
    <ellipse cx="640" cy="285" rx="435" ry="335" fill="url(#core)"/>
    <g stroke="#7c8ca9" stroke-opacity=".075" stroke-width="1" transform="translate(0 ${(t * 13 % 48).toFixed(1)})">${gridX}${gridY}</g>
    <g>${dots}</g>
    <g fill="none" stroke-linecap="round" transform="translate(640 265)">
      <circle r="211" stroke="#67e8f9" stroke-opacity="${(.10 + .08 * pulse).toFixed(3)}" stroke-width="1" stroke-dasharray="2 13"/>
      <circle r="193" stroke="#8b5cf6" stroke-opacity="${(.10 + .06 * pulse).toFixed(3)}" stroke-width="1"/>
      <circle r="225" stroke="url(#cyanMagenta)" stroke-width="2.2" stroke-dasharray="${(300 * orbital).toFixed(1)} 1100" transform="rotate(${rot1.toFixed(1)})" opacity=".9"/>
      <circle r="178" stroke="#22d3ee" stroke-opacity=".6" stroke-width="1.3" stroke-dasharray="${(180 * orbital).toFixed(1)} 900" transform="rotate(${rot2.toFixed(1)})"/>
      <path d="M-234 0H-200M200 0h34M0-232v34M0 198v34" stroke="#a5f3fc" stroke-width="1.3" opacity="${(0.3 + .35 * orbital).toFixed(3)}"/>
      <path d="M-165-166l22 22M165-166l-22 22M-165 166l22-22M165 166l-22-22" stroke="#c4b5fd" stroke-opacity=".38"/>
      <circle cx="${(Number(orbitDotX) - 640).toFixed(2)}" cy="${(Number(orbitDotY) - 265).toFixed(2)}" r="3.2" fill="#a5f3fc" stroke="none" filter="url(#shine)"/>
    </g>
    <g stroke="#67e8f9" fill="none" stroke-width="1" opacity="${hudOpacity}">
      <path d="M84 103h54m-54 0v54M1196 103h-54m54 0v54M84 617h54m-54 0v-54M1196 617h-54m54 0v-54"/>
      <path d="M84 171h68M84 178h43M1196 548h-68M1196 555h-43" opacity=".55"/>
      <path d="M221 572h112l12-12 9 22 13-10h59M1059 144H947l-12 12-9-22-13 10h-59" opacity=".52"/>
    </g>
    <g fill="#a5f3fc" opacity="${(0.22 + .12 * pulse).toFixed(3)}">
      ${Array.from({ length: 8 }, (_, i) => `<rect x="${96 + i * 9}" y="590" width="3" height="${5 + ((i + f) % 4) * 4}" rx="1"/>`).join('')}
      ${Array.from({ length: 8 }, (_, i) => `<rect x="${1124 + i * 9}" y="130" width="3" height="${5 + ((i * 2 + f) % 4) * 4}" rx="1"/>`).join('')}
    </g>
    <rect x="0" y="${scanY}" width="1280" height="2" fill="url(#scan)" opacity=".44"/>
    <rect x="0" y="${(Number(scanY) - 5).toFixed(1)}" width="1280" height="12" fill="#22d3ee" opacity=".035" filter="url(#scanblur)"/>
    <g text-anchor="middle" font-family="Inter, Segoe UI, Arial, sans-serif">
      <path d="M410 443H870" stroke="url(#cyanMagenta)" stroke-width="1.5" opacity="${(titleIn * .9).toFixed(3)}"/>
      <text x="640" y="${wordY}" fill="#ffffff" font-size="54" font-weight="700" letter-spacing="-.9" opacity="${titleIn.toFixed(3)}" filter="url(#shine)">Q Intelligence</text>
      <text x="640" y="${supportY}" fill="#d9e4ff" font-size="29" font-weight="500" letter-spacing=".25" opacity="${lineIn.toFixed(3)}">We are Here - For you!</text>
    </g>
    <path d="M512 587h256" stroke="#465778" stroke-width="1" opacity=".7"/>
    <path d="M512 587h${(256 * progress).toFixed(1)}" stroke="url(#cyanMagenta)" stroke-width="2" filter="url(#shine)"/>
  </svg>`;
  const background = await sharp(Buffer.from(svg)).png().toBuffer();
  const logoSizePx = Math.max(1, logoSize);
  const mark = await sharp(logo).resize(logoSizePx, logoSizePx, { fit: 'contain' }).png().toBuffer();
  const png = await sharp(background).composite([{ input: mark, left: logoLeft, top: logoTop }]).jpeg({ quality: 86, chromaSubsampling: '4:2:0' }).toBuffer();
  await fs.writeFile(path.join(frameDir, `frame-${String(f).padStart(3, '0')}.jpg`), png);
  if (f === frameCount - 1) await fs.writeFile(path.join(outDir, 'q-intelligence-tech-intro-poster.jpg'), png);
}

// The soundtrack uses a warm synth bed, a restrained rhythmic pulse, and a
// rising digital arpeggio, with soft impacts synchronized to the logo and type.
const dryL = new Float32Array(totalSamples), dryR = new Float32Array(totalSamples);
const noteFreq = [293.66, 349.23, 440, 587.33, 440, 587.33, 698.46, 880];
function addTone(start, freq, amp, decay, pan = 0, partial = 0) {
  const offset = Math.max(0, Math.floor(start * sampleRate));
  const length = Math.min(Math.floor(decay * sampleRate), totalSamples - offset);
  for (let j = 0; j < length; j++) {
    const age = j / sampleRate;
    const env = Math.min(1, age / .008) * Math.exp(-age * 4.5);
    const v = amp * env * (Math.sin(2 * Math.PI * freq * age) + partial * Math.sin(2 * Math.PI * freq * 2.01 * age));
    dryL[offset + j] += v * (pan > 0 ? 1 - pan * .30 : 1);
    dryR[offset + j] += v * (pan < 0 ? 1 + pan * .30 : 1);
  }
}
function addLowSweep(start, duration, volume) {
  const begin = Math.floor(start * sampleRate), n = Math.floor(duration * sampleRate);
  let phase = 0;
  for (let j = 0; j < n && begin + j < totalSamples; j++) {
    const x = j / n, freq = 54 + 98 * x;
    phase += 2 * Math.PI * freq / sampleRate;
    const env = Math.sin(Math.PI * x) ** 1.4;
    const v = volume * env * (Math.sin(phase) + .28 * Math.sin(phase * 2.03));
    dryL[begin + j] += v; dryR[begin + j] += v;
  }
}
function addWhoosh(start, duration, volume) {
  const begin = Math.floor(start * sampleRate), n = Math.floor(duration * sampleRate);
  let previous = 0, seed = 0x71c3a29d;
  for (let j = 0; j < n && begin + j < totalSamples; j++) {
    seed = (1664525 * seed + 1013904223) >>> 0;
    const noise = seed / 0xffffffff * 2 - 1;
    const high = noise - previous * .86; previous = noise;
    const x = j / n;
    const env = Math.sin(Math.PI * x) ** 2;
    const v = volume * env * (high * .34 + noise * .15);
    dryL[begin + j] += v * .94; dryR[begin + j] += v;
  }
}
function addImpact(start, volume, duration = .5) {
  const begin = Math.floor(start * sampleRate), n = Math.floor(duration * sampleRate);
  let phase = 0;
  for (let j = 0; j < n && begin + j < totalSamples; j++) {
    const x = j / n, age = j / sampleRate;
    const freq = 82 + 30 * Math.exp(-age * 14);
    phase += 2 * Math.PI * freq / sampleRate;
    const body = Math.sin(phase) * Math.exp(-age * 8);
    const click = (j < sampleRate * .018 ? (1 - j / (sampleRate * .018)) : 0) * Math.sin(2 * Math.PI * 2100 * age) * .15;
    const v = volume * (body + click) * (.45 + .55 * Math.cos(Math.PI * x / 2));
    dryL[begin + j] += v; dryR[begin + j] += v;
  }
}

for (let i = 0; i < totalSamples; i++) {
  const t = i / sampleRate;
  const fadeIn = smoother(0, 2.2, t);
  const fadeOut = 1 - smoother(5.6, 7, t);
  const bedEnv = .40 * fadeIn * fadeOut * (.88 + .12 * Math.sin(2 * Math.PI * .13 * t));
  const pad = bedEnv * (.035 * Math.sin(2 * Math.PI * 55 * t) + .023 * Math.sin(2 * Math.PI * 110 * t) + .013 * Math.sin(2 * Math.PI * 164.81 * t));
  dryL[i] += pad; dryR[i] += pad;
  const beat = .588235;
  for (let b = 0; b < 12; b++) {
    const age = t - (.28 + b * beat);
    if (age >= 0 && age < .10) {
      const click = Math.exp(-age * 42) * Math.sin(2 * Math.PI * (1600 - 400 * age) * age) * .018;
      dryL[i] += click * (b % 2 ? .7 : 1); dryR[i] += click * (b % 2 ? 1 : .7);
    }
  }
}
// Measured rising eighth-note arpeggio, placed through the initial scan.
for (let n = 0; n < 12; n++) addTone(.24 + n * .115, noteFreq[n % noteFreq.length], .030, .34, n % 2 ? .45 : -.45, .22);
for (let n = 0; n < 5; n++) addTone(3.25 + n * .21, noteFreq[(n + 3) % noteFreq.length], .013, .30, n % 2 ? -.35 : .35, .16);
addWhoosh(.18, 1.34, .12);
addLowSweep(.77, .78, .12);
addImpact(1.19, .13, .54);
// Warm, open chord for the mark reveal.
for (const [freq, amp, pan] of [[440, .052, -.25], [554.37, .046, .08], [659.25, .042, .25], [880, .018, 0]]) addTone(1.23, freq, amp, 1.35, pan, .18);
addLowSweep(1.84, .44, .075); addImpact(2.02, .072, .42);
for (const [freq, amp, pan] of [[587.33, .034, -.2], [739.99, .030, .15], [880, .025, .3]]) addTone(2.08, freq, amp, .88, pan, .16);
addLowSweep(2.56, .37, .042);
for (const [freq, amp, pan] of [[659.25, .025, -.35], [783.99, .028, .15], [987.77, .021, .35], [1318.51, .009, 0]]) addTone(2.72, freq, amp, .82, pan, .14);
// Subtle stereo reflections add space without obscuring the message.
const wetL = new Float32Array(totalSamples), wetR = new Float32Array(totalSamples);
for (let i = 0; i < totalSamples; i++) {
  wetL[i] = dryL[i] + (i > 3600 ? dryR[i - 3600] * .22 : 0) + (i > 8200 ? dryL[i - 8200] * .14 : 0) + (i > 14300 ? dryR[i - 14300] * .09 : 0);
  wetR[i] = dryR[i] + (i > 3600 ? dryL[i - 3600] * .22 : 0) + (i > 8200 ? dryR[i - 8200] * .14 : 0) + (i > 14300 ? dryL[i - 14300] * .09 : 0);
}
const pcm = Buffer.alloc(totalSamples * channels * 2);
for (let i = 0; i < totalSamples; i++) {
  const l = Math.tanh(wetL[i] * 1.42) * 1.31, r = Math.tanh(wetR[i] * 1.42) * 1.31;
  pcm.writeInt16LE(Math.round(l * 32767), i * 4);
  pcm.writeInt16LE(Math.round(r * 32767), i * 4 + 2);
}
const wav = Buffer.alloc(44 + pcm.length);
wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVE', 8);
wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(channels, 22); wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * channels * 2, 28);
wav.writeUInt16LE(channels * 2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(pcm.length, 40); pcm.copy(wav, 44);
await fs.writeFile(wavPath, wav);

function fourcc(s) { return Buffer.from(s, 'ascii'); }
function aviChunk(id, data) { const b = Buffer.alloc(8 + data.length + (data.length & 1)); fourcc(id).copy(b, 0); b.writeUInt32LE(data.length, 4); data.copy(b, 8); return b; }
function list(type, ...items) { return aviChunk('LIST', Buffer.concat([fourcc(type), ...items])); }
function strh({ type, handler = '\0\0\0\0', scale, rate, length, bufferSize, sampleSize, w = 0, h = 0 }) {
  const b = Buffer.alloc(56); fourcc(type).copy(b, 0); fourcc(handler).copy(b, 4);
  b.writeUInt32LE(0, 8); b.writeUInt16LE(0, 12); b.writeUInt16LE(0, 14); b.writeUInt32LE(0, 16);
  b.writeUInt32LE(scale, 20); b.writeUInt32LE(rate, 24); b.writeUInt32LE(0, 28); b.writeUInt32LE(length, 32);
  b.writeUInt32LE(bufferSize, 36); b.writeUInt32LE(0xffffffff, 40); b.writeUInt32LE(sampleSize, 44);
  b.writeInt16LE(0, 48); b.writeInt16LE(0, 50); b.writeInt16LE(w, 52); b.writeInt16LE(h, 54); return b;
}
const frames = [];
let maxFrame = 0;
for (let i = 0; i < frameCount; i++) {
  const data = await fs.readFile(path.join(frameDir, `frame-${String(i).padStart(3, '0')}.jpg`));
  frames.push(data); maxFrame = Math.max(maxFrame, data.length);
}
const videoFormat = Buffer.alloc(40); videoFormat.writeUInt32LE(40, 0); videoFormat.writeInt32LE(width, 4); videoFormat.writeInt32LE(height, 8);
videoFormat.writeUInt16LE(1, 12); videoFormat.writeUInt16LE(24, 14); fourcc('MJPG').copy(videoFormat, 16);
const audioFormat = Buffer.alloc(16); audioFormat.writeUInt16LE(1, 0); audioFormat.writeUInt16LE(channels, 2); audioFormat.writeUInt32LE(sampleRate, 4);
audioFormat.writeUInt32LE(sampleRate * channels * 2, 8); audioFormat.writeUInt16LE(channels * 2, 12); audioFormat.writeUInt16LE(16, 14);
const videoStream = list('strl', aviChunk('strh', strh({ type: 'vids', handler: 'MJPG', scale: 1, rate: fps, length: frameCount, bufferSize: maxFrame, sampleSize: 0, w: width, h: height })), aviChunk('strf', videoFormat));
const audioStream = list('strl', aviChunk('strh', strh({ type: 'auds', scale: channels * 2, rate: sampleRate * channels * 2, length: totalSamples, bufferSize: sampleRate * channels * 2 / fps, sampleSize: channels * 2 })), aviChunk('strf', audioFormat));
const mainHeader = Buffer.alloc(56); mainHeader.writeUInt32LE(Math.round(1_000_000 / fps), 0);
mainHeader.writeUInt32LE(Math.round((maxFrame + sampleRate * channels * 2 / fps) * fps), 4); mainHeader.writeUInt32LE(0, 8);
mainHeader.writeUInt32LE(0x10, 12); mainHeader.writeUInt32LE(frameCount, 16); mainHeader.writeUInt32LE(0, 20); mainHeader.writeUInt32LE(2, 24);
mainHeader.writeUInt32LE(maxFrame, 28); mainHeader.writeUInt32LE(width, 32); mainHeader.writeUInt32LE(height, 36);
const headers = list('hdrl', aviChunk('avih', mainHeader), videoStream, audioStream);
const moviParts = [], index = []; let movieOffset = 4;
for (let i = 0; i < frameCount; i++) {
  const vc = aviChunk('00dc', frames[i]);
  const start = Math.round(i * sampleRate / fps), end = Math.round((i + 1) * sampleRate / fps);
  const ac = aviChunk('01wb', pcm.subarray(start * channels * 2, end * channels * 2));
  moviParts.push(vc, ac);
  const vi = Buffer.alloc(16); fourcc('00dc').copy(vi, 0); vi.writeUInt32LE(0x10, 4); vi.writeUInt32LE(movieOffset, 8); vi.writeUInt32LE(frames[i].length, 12); index.push(vi); movieOffset += vc.length;
  const ai = Buffer.alloc(16); fourcc('01wb').copy(ai, 0); ai.writeUInt32LE(0, 4); ai.writeUInt32LE(movieOffset, 8); ai.writeUInt32LE(ac.readUInt32LE(4), 12); index.push(ai); movieOffset += ac.length;
}
const movie = list('movi', ...moviParts), idx1 = aviChunk('idx1', Buffer.concat(index));
const payload = Buffer.concat([fourcc('AVI '), headers, movie, idx1]);
const avi = Buffer.alloc(8 + payload.length); fourcc('RIFF').copy(avi, 0); avi.writeUInt32LE(payload.length, 4); payload.copy(avi, 8);
await fs.writeFile(videoPath, avi);
console.log(`Created ${videoPath} (${width}x${height}, ${fps} fps, ${seconds}s, synchronized stereo synth sound).`);
