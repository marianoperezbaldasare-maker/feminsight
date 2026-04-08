import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let loaded = false;

async function loadFFmpeg(onLog?: (msg: string) => void) {
  if (loaded && ffmpeg) return ffmpeg;
  ffmpeg = new FFmpeg();
  if (onLog) ffmpeg.on('log', ({ message }) => onLog(message));
  const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  loaded = true;
  return ffmpeg;
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(v.duration || 30); };
    v.onerror = () => resolve(30);
    v.src = URL.createObjectURL(file);
  });
}

export async function compressVideo(
  file: File,
  targetMB = 2.5,
  onProgress?: (pct: number) => void,
): Promise<File> {
  if (file.size <= targetMB * 1024 * 1024) return file;

  onProgress?.(5);
  const ff = await loadFFmpeg();
  onProgress?.(20);

  const duration = await getVideoDuration(file);
  const targetBits = targetMB * 8 * 1024 * 1024;
  const totalKbps = Math.floor(targetBits / duration / 1000);
  const videokbps = Math.max(100, Math.floor(totalKbps * 0.88));
  const audiokbps = Math.max(32, totalKbps - videokbps);

  await ff.writeFile('in.mp4', await fetchFile(file));
  onProgress?.(40);

  ff.on('progress', ({ progress }) => onProgress?.(40 + Math.round(progress * 50)));

  await ff.exec([
    '-i', 'in.mp4',
    '-vf', 'scale=iw*min(1\\,640/iw):ih*min(1\\,640/iw)',
    '-c:v', 'libx264', '-b:v', `${videokbps}k`,
    '-c:a', 'aac',     '-b:a', `${audiokbps}k`,
    '-preset', 'ultrafast', '-movflags', '+faststart',
    'out.mp4',
  ]);

  const raw = await ff.readFile('out.mp4');
  const bytes = raw instanceof Uint8Array ? raw : new TextEncoder().encode(raw as unknown as string);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  await ff.deleteFile('in.mp4');
  await ff.deleteFile('out.mp4');

  onProgress?.(100);
  return new File([buffer], 'compressed.mp4', { type: 'video/mp4' });
}
