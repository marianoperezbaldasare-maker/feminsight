'use client';

import { useState, useRef, useCallback } from 'react';
import { Category, CATEGORIES, SEGMENT_META, SEGMENT_KEYS, UploadedImage } from '@/types';

interface NewAnalysisProps {
  onSubmit: (name: string, category: Category, idea: string, images: UploadedImage[], urls: string[]) => void;
  loading: boolean;
  loadingStage: number;
}

const STAGE_LABELS = SEGMENT_KEYS.map((k) => SEGMENT_META[k].label);
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGES = 5;
const MAX_MB = 10; // raw file limit — canvas will compress before sending
const MAX_DIMENSION = 1280; // resize to fit within this box
const JPEG_QUALITY = 0.82;

// Resize + compress image via canvas → always outputs JPEG to minimise payload
function compressImage(file: File): Promise<{ base64: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not available')); return; }
      // White background for PNGs with transparency
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, previewUrl: dataUrl });
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error(`Failed to load ${file.name}`)); };
    img.src = objectUrl;
  });
}

function fileToUploadedImage(file: File): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      reject(new Error(`${file.name}: format not supported. Use JPG, PNG, GIF or WEBP.`));
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      reject(new Error(`${file.name}: exceeds ${MAX_MB}MB limit.`));
      return;
    }
    compressImage(file)
      .then(({ base64, previewUrl }) => {
        resolve({
          id: crypto.randomUUID(),
          name: file.name,
          base64,
          mediaType: 'image/jpeg', // canvas always outputs JPEG
          previewUrl,
        });
      })
      .catch(reject);
  });
}

const MAX_URLS = 3;

export default function NewAnalysis({ onSubmit, loading, loadingStage }: NewAnalysisProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Business Idea');
  const [idea, setIdea] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [imageError, setImageError] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = idea.length;
  const maxChars = 500;

  async function addFiles(files: FileList | File[]) {
    setImageError('');
    const arr = Array.from(files);
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setImageError(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }
    const toProcess = arr.slice(0, remaining);
    const results: UploadedImage[] = [];
    for (const file of toProcess) {
      try {
        const img = await fileToUploadedImage(file);
        results.push(img);
      } catch (e) {
        setImageError(e instanceof Error ? e.message : 'Upload error');
        return;
      }
    }
    setImages((prev) => [...prev, ...results]);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }, [images]);

  function removeImage(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setImageError('');
  }

  function addUrl() {
    setUrlError('');
    const raw = urlInput.trim();
    if (!raw) return;
    let normalized = raw;
    if (!/^https?:\/\//i.test(normalized)) normalized = 'https://' + normalized;
    try { new URL(normalized); } catch { setUrlError('Invalid URL'); return; }
    if (urls.includes(normalized)) { setUrlError('URL already added'); return; }
    if (urls.length >= MAX_URLS) { setUrlError(`Maximum ${MAX_URLS} URLs allowed`); return; }
    setUrls((prev) => [...prev, normalized]);
    setUrlInput('');
  }

  function removeUrl(url: string) {
    setUrls((prev) => prev.filter((u) => u !== url));
    setUrlError('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idea.trim() || loading) return;
    const sessionName =
      name.trim() ||
      `Analysis ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    onSubmit(sessionName, category, idea, images, urls);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F5F6FA]">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#7C3AED] animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h2 className="text-gray-900 text-xl font-semibold mb-1">Running Focus Group</h2>
            <p className="text-gray-400 text-sm">Interviewing 10,000 women across 6 segments…</p>
          </div>

          <div className="space-y-3">
            {SEGMENT_KEYS.map((key, i) => {
              const meta = SEGMENT_META[key];
              const isDone = i < loadingStage;
              const isActive = i === loadingStage;
              return (
                <div
                  key={key}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
                    isDone
                      ? 'bg-emerald-50 border-emerald-200 opacity-70'
                      : isActive
                      ? 'bg-white border-[#7C3AED]/40 shadow-sm'
                      : 'bg-gray-50 border-gray-200 opacity-40'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{ color: isDone ? '#10B981' : isActive ? meta.color : '#D1D5DB' }}
                  >
                    {isDone ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs">{meta.icon}</span>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                      {meta.label}
                    </div>
                    <div className="text-gray-400 text-[10px]">{meta.description}</div>
                  </div>
                  {isActive && (
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map((d) => (
                        <div
                          key={d}
                          className="w-1 h-1 rounded-full bg-[#7C3AED] animate-bounce"
                          style={{ animationDelay: `${d * 0.15}s` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7C3AED] to-[#a78bfa] rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, (loadingStage / SEGMENT_KEYS.length) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">New Analysis</h1>
          <p className="text-gray-500 text-base leading-relaxed">
            Describe your idea, product, or concept. Our synthetic focus group of 10,000 women will evaluate it across 6 distinct audience segments.
          </p>
        </div>

        {/* Segments preview */}
        <div className="flex flex-wrap gap-2 mb-10">
          {SEGMENT_KEYS.map((key) => {
            const meta = SEGMENT_META[key];
            return (
              <div
                key={key}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 text-xs"
              >
                <span style={{ color: meta.color }}>{meta.icon}</span>
                <span>{meta.label}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-[#7C3AED] text-xs font-medium">
            10,000 women total
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Session name */}
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">
              Session Name <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Masterpiece Board Game Launch"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#7C3AED] transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                    category === cat
                      ? 'bg-[#7C3AED]/10 border-[#7C3AED]/40 text-[#7C3AED]'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Idea textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-gray-600 text-sm font-medium">
                Idea, Product, or Question <span className="text-red-400">*</span>
              </label>
              <span className={`text-xs ${charCount > maxChars * 0.9 ? 'text-amber-500' : 'text-gray-400'}`}>
                {charCount}/{maxChars}
              </span>
            </div>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value.slice(0, maxChars))}
              placeholder="Describe your idea clearly. Include what it is, who it's for, how it works, and what makes it different. The more specific, the better the analysis."
              rows={6}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#7C3AED] transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Image upload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-gray-600 text-sm font-medium">
                Logos & Design Images{' '}
                <span className="text-gray-400 font-normal">(optional, up to {MAX_IMAGES})</span>
              </label>
              {images.length > 0 && (
                <span className="text-[#7C3AED] text-xs">
                  {images.length}/{MAX_IMAGES}
                </span>
              )}
            </div>

            {/* Drop zone */}
            {images.length < MAX_IMAGES && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-6 md:py-8 cursor-pointer transition-all ${
                  dragOver
                    ? 'border-[#7C3AED]/60 bg-[#7C3AED]/5'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-white'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm font-medium">
                    Drop images here or <span className="text-[#7C3AED]">click to browse</span>
                  </p>
                  <p className="text-gray-400 text-xs mt-1">JPG, PNG, GIF, WEBP · max {MAX_MB}MB each</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES.join(',')}
                  multiple
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
            )}

            {/* Error */}
            {imageError && (
              <p className="mt-2 text-red-400 text-xs flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {imageError}
              </p>
            )}

            {/* Previews */}
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 md:grid-cols-5 gap-2">
                {images.map((img) => (
                  <div key={img.id} className="relative group aspect-square">
                    <img
                      src={img.previewUrl}
                      alt={img.name}
                      className="w-full h-full object-cover rounded-xl border border-white/10"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 rounded-xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                      <p className="text-white text-[9px] text-center leading-tight line-clamp-2 px-1">
                        {img.name}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                        className="w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors mt-1"
                        aria-label="Remove image"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {images.length > 0 && (
              <p className="mt-2 text-gray-400 text-xs">
                The focus group will evaluate your visual assets — logo, branding, design quality, and aesthetic appeal.
              </p>
            )}
          </div>

          {/* URL input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-gray-600 text-sm font-medium">
                Web Pages to Analyze{' '}
                <span className="text-gray-400 font-normal">(optional, up to {MAX_URLS})</span>
              </label>
              {urls.length > 0 && (
                <span className="text-[#7C3AED] text-xs">{urls.length}/{MAX_URLS}</span>
              )}
            </div>
            {urls.length < MAX_URLS && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => { setUrlInput(e.target.value); setUrlError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
                  placeholder="https://yourwebsite.com"
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#7C3AED] transition-all"
                />
                <button
                  type="button"
                  onClick={addUrl}
                  className="px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-200 text-sm font-medium transition-all"
                >
                  Add
                </button>
              </div>
            )}
            {urlError && (
              <p className="mt-2 text-red-400 text-xs flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {urlError}
              </p>
            )}
            {urls.length > 0 && (
              <div className="mt-3 space-y-2">
                {urls.map((url) => (
                  <div key={url} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
                    <svg className="w-4 h-4 text-[#7C3AED] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="flex-1 text-gray-700 text-xs truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => removeUrl(url)}
                      className="w-5 h-5 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors"
                      aria-label="Remove URL"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <p className="text-gray-400 text-xs">
                  The focus group will analyze the messaging, design, and value proposition of each page.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!idea.trim()}
            className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-6 py-3.5 text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/25"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Run Focus Group
            {(images.length > 0 || urls.length > 0) && (
              <span className="text-[#c4b5fd] text-xs font-normal">
                {[
                  images.length > 0 ? `${images.length} image${images.length > 1 ? 's' : ''}` : '',
                  urls.length > 0 ? `${urls.length} URL${urls.length > 1 ? 's' : ''}` : '',
                ].filter(Boolean).join(' · ')}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
