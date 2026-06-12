import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { aiIdentify, aiNarrate } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import { Camera, Upload, Volume2, Square, Loader2, Search, RotateCcw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const Scanner = () => {
  const { t } = useLanguage();
  const [mode, setMode] = useState(null); // 'camera' | 'upload'
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [identifying, setIdentifying] = useState(false);
  const [narrating, setNarrating] = useState(false);
  const [result, setResult] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  // Start camera
  const startCamera = useCallback(async () => {
    setMode('camera');
    setResult(null);
    setAudioUrl(null);
    setError('');
    setPreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError(t('scanner.cameraError'));
    }
  }, [t]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const capturedFile = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setFile(capturedFile);
      setPreview(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg', 0.85);
  }, [stopCamera]);

  // Handle file upload
  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setMode('upload');
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setAudioUrl(null);
    setError('');
  };

  // Send image for identification
  const handleIdentify = async () => {
    if (!file) return;
    setIdentifying(true);
    setError('');
    setResult(null);
    setAudioUrl(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await aiIdentify(formData);
      setResult(data);

      // Auto-narrate the description
      if (data.description) {
        setNarrating(true);
        try {
          const narrationPayload = data.matched && data.exhibitionId
            ? { exhibitionId: data.exhibitionId }
            : { text: data.description };
          const { data: audioData } = await aiNarrate(narrationPayload);
          setAudioUrl(audioData.audioUrl);
        } catch {
          // Narration failed but identification succeeded — still usable
        } finally {
          setNarrating(false);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || t('scanner.identifyError'));
    } finally {
      setIdentifying(false);
    }
  };

  // Reset everything
  const handleReset = () => {
    stopCamera();
    setMode(null);
    setPreview(null);
    setFile(null);
    setResult(null);
    setAudioUrl(null);
    setError('');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const fullAudioUrl = audioUrl ? (audioUrl.startsWith('http') ? audioUrl : `${API_BASE}${audioUrl}`) : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
          <Search size={16} />
          {t('scanner.badge')}
        </div>
        <h1 className="text-3xl font-bold dark:text-white">{t('scanner.identifyTitle')}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">{t('scanner.identifySubtitle')}</p>
      </div>

      {/* Mode selection — show only when no image is captured */}
      {!preview && !mode && (
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <button
            onClick={startCamera}
            className="flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition group"
          >
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera size={28} className="text-amber-600" />
            </div>
            <span className="font-semibold dark:text-white">{t('scanner.takePhoto')}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{t('scanner.takePhotoDesc')}</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition group"
          >
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload size={28} className="text-amber-600" />
            </div>
            <span className="font-semibold dark:text-white">{t('scanner.uploadPhoto')}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{t('scanner.uploadPhotoDesc')}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Camera view */}
      {mode === 'camera' && !preview && (
        <div className="mb-6">
          <div className="relative rounded-2xl overflow-hidden bg-black">
            <video ref={videoRef} autoPlay playsInline className="w-full h-[400px] object-cover" />
            {/* Viewfinder overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 border-2 border-white/50 rounded-2xl" />
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700 transition shadow-lg"
            >
              <Camera size={28} />
            </button>
            <button
              onClick={() => { stopCamera(); setMode(null); }}
              className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition"
            >
              <Square size={24} />
            </button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />

      {/* Image preview + identify */}
      {preview && (
        <div className="mb-6">
          <div className="relative rounded-2xl overflow-hidden">
            <img src={preview} alt="Captured" className="w-full h-[400px] object-cover" />
            {identifying && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                <Loader2 size={48} className="text-amber-500 animate-spin" />
                <p className="text-white mt-3 font-medium">{t('scanner.analyzing')}</p>
              </div>
            )}
          </div>
          <div className="flex justify-center gap-3 mt-4">
            {!result && (
              <button
                onClick={handleIdentify}
                disabled={identifying}
                className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-amber-700 transition disabled:opacity-50"
              >
                <Search size={18} />
                {identifying ? t('scanner.analyzing') : t('scanner.identify')}
              </button>
            )}
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-full font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition"
            >
              <RotateCcw size={18} />
              {t('scanner.tryAnother')}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-xl mb-6 text-center">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Confidence badge */}
          <div className="flex items-center justify-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
              result.matched
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            }`}>
              <Search size={14} />
              {result.matched ? t('scanner.matchFound') : t('scanner.noMatch')}
              {result.confidence !== 'none' && ` • ${result.confidence} confidence`}
            </span>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-lg dark:text-white mb-3 flex items-center gap-2">
              <Volume2 size={18} className="text-amber-600" />
              {t('scanner.narration')}
            </h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{result.description}</p>

            {/* Audio player */}
            {narrating && (
              <div className="flex items-center gap-3 mt-4 text-amber-600">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">{t('scanner.generatingAudio')}</span>
              </div>
            )}
            {fullAudioUrl && (
              <div className="mt-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 size={18} className="text-amber-600" />
                  <span className="text-sm font-medium dark:text-white">{t('scanner.listenNarration')}</span>
                </div>
                <audio ref={audioRef} controls autoPlay className="w-full" preload="auto">
                  <source src={fullAudioUrl} type="audio/mpeg" />
                </audio>
              </div>
            )}
          </div>

          {/* Matched exhibition card */}
          {result.exhibition && (
            <Link
              to={`/exhibitions/${result.exhibition._id}`}
              className="block bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition group"
            >
              <div className="flex gap-4 p-4">
                {result.exhibition.coverImage && (
                  <img
                    src={result.exhibition.coverImage.startsWith('http') ? result.exhibition.coverImage : `${API_BASE}${result.exhibition.coverImage}`}
                    alt={result.exhibition.title?.en || 'Exhibition'}
                    className="w-24 h-24 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold dark:text-white group-hover:text-amber-600 transition">{result.exhibition.title?.en || result.exhibition.title}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{result.exhibition.shortDescription?.en || ''}</p>
                  {result.exhibition.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {result.exhibition.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('scanner.viewFull')} →</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* How it works — show when idle */}
      {!mode && !preview && !result && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold dark:text-white mb-4">{t('scanner.howItWorks')}</h3>
          <div className="space-y-3">
            {[t('scanner.step1'), t('scanner.step2'), t('scanner.step3')].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <p className="text-sm text-slate-600 dark:text-slate-400 pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
