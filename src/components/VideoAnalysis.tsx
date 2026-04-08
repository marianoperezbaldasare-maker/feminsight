'use client';

import { useState, useRef, useCallback } from 'react';
import { VideoAnalysisResult, VideoSession } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

const MAX_MB = 20;
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
const ACCEPTED_EXTENSIONS = '.mp4,.mov,.webm,.avi';

interface VideoAnalysisProps {
  password?: string | null;
  onResult: (session: VideoSession) => void;
}

export default function VideoAnalysis({ password, onResult }: VideoAnalysisProps) {
  const { lang } = useLanguage();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [studyName, setStudyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = lang === 'en' ? {
    title: 'Video Focus Group',
    subtitle: 'Upload a commercial, reel, or story. Our synthetic focus group of 10,000 women will watch it and report their real reactions — moment by moment.',
    nameLabel: 'Session Name',
    namePlaceholder: 'e.g. Summer Campaign Reel 2025',
    nameOptional: '(optional)',
    dropTitle: 'Drop your video here or',
    dropBrowse: 'browse',
    dropSub: 'MP4, MOV, WEBM · max 20MB',
    changeVideo: 'Change video',
    runBtn: 'Run Video Focus Group',
    analyzing: 'Uploading video…',
    analyzing2: 'The focus group is watching…',
    analyzing3: 'Collecting reactions…',
    error: 'Error',
    tips: [
      'Works best with 15–60 second videos',
      'Reels, stories, commercials, brand films',
      'Gemini sees the full video — audio, music, narration, on-screen text',
    ],
  } : {
    title: 'Focus Group de Video',
    subtitle: 'Subí un comercial, reel o historia. Nuestro focus group sintético de 10,000 mujeres lo va a ver y reportar sus reacciones reales — momento a momento.',
    nameLabel: 'Nombre de sesión',
    namePlaceholder: 'Ej: Reel campaña verano 2025',
    nameOptional: '(opcional)',
    dropTitle: 'Arrastrá tu video acá o',
    dropBrowse: 'explorá',
    dropSub: 'MP4, MOV, WEBM · máx 20MB',
    changeVideo: 'Cambiar video',
    runBtn: 'Correr Focus Group de Video',
    analyzing: 'Subiendo video…',
    analyzing2: 'El focus group está viendo el video…',
    analyzing3: 'Recopilando reacciones…',
    error: 'Error',
    tips: [
      'Funciona mejor con videos de 15–60 segundos',
      'Reels, stories, comerciales, brand films',
      'Gemini ve el video completo — audio, música, narración, texto en pantalla',
    ],
  };

  function handleFile(file: File) {
    setError('');
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      setError(lang === 'en' ? 'Unsupported format. Use MP4, MOV, or WEBM.' : 'Formato no soportado. Usá MP4, MOV o WEBM.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(lang === 'en' ? `File too large. Max ${MAX_MB}MB.` : `Archivo muy grande. Máx ${MAX_MB}MB.`);
      return;
    }
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [videoPreviewUrl, lang]);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!videoFile || loading) return;

    setLoading(true);
    setError('');
    setProgress(t.analyzing);

    try {
      // Convert to base64
      const arrayBuffer = await videoFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      setProgress(t.analyzing2);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (password) headers['x-access-password'] = password;

      const res = await fetch('/api/analyze-video', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          videoBase64: base64,
          mimeType: videoFile.type,
          studyName: studyName.trim() || videoFile.name,
        }),
      });

      setProgress(t.analyzing3);

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? 'Analysis failed');
      }

      const data = await res.json() as { result: VideoAnalysisResult };
      const session: VideoSession = {
        id: crypto.randomUUID(),
        name: studyName.trim() || videoFile.name,
        date: new Date().toISOString(),
        videoName: videoFile.name,
        mimeType: videoFile.type,
        result: data.result,
      };

      onResult(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setProgress('');
    }
  }

  const fileSizeMB = videoFile ? (videoFile.size / 1024 / 1024).toFixed(1) : null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
          </div>
          <p className="text-gray-500 text-base leading-relaxed">{t.subtitle}</p>
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-100 rounded-2xl p-4 mb-8">
          <ul className="space-y-1.5">
            {t.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-rose-400 mt-0.5">◆</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Session name */}
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">
              {t.nameLabel} <span className="text-gray-400 font-normal">{t.nameOptional}</span>
            </label>
            <input
              type="text"
              value={studyName}
              onChange={(e) => setStudyName(e.target.value)}
              placeholder={t.namePlaceholder}
              disabled={loading}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-rose-400 transition-all disabled:opacity-50"
            />
          </div>

          {/* Video upload */}
          <div>
            {!videoFile ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-12 cursor-pointer transition-all ${
                  dragOver
                    ? 'border-rose-400 bg-rose-50'
                    : 'border-gray-300 bg-gray-50 hover:border-rose-300 hover:bg-rose-50/30'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                  <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-gray-700 text-sm font-medium">
                    {t.dropTitle} <span className="text-rose-500">{t.dropBrowse}</span>
                  </p>
                  <p className="text-gray-400 text-xs mt-1">{t.dropSub}</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <video
                  src={videoPreviewUrl ?? ''}
                  controls
                  className="w-full max-h-64 object-contain bg-black"
                />
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{videoFile.name}</p>
                    <p className="text-xs text-gray-400">{fileSizeMB}MB · {videoFile.type.split('/')[1].toUpperCase()}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setVideoFile(null); if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl); setVideoPreviewUrl(null); }}
                    className="text-xs text-rose-500 hover:text-rose-700 font-medium transition-colors"
                  >
                    {t.changeVideo}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="mt-2 text-red-400 text-xs flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!videoFile || loading}
            className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold rounded-2xl px-6 py-4 transition-all disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {progress}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {t.runBtn}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
