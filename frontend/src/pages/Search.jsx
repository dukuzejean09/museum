import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { globalSearch, aiIdentifyVisitor, aiNarrateVisitorStream } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Search as SearchIcon, Sparkles, Compass, X, Clock, ArrowRight,
  Camera, Upload, Volume2, Loader2, RotateCcw, Square, ImageIcon,
  Landmark, BookOpen, Map,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { CardGridSkeleton } from '../components/ui/LoadingSkeleton';
const API_BASE = (() => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return url.replace('/api', '');
})();

const getLocalizedText = (field, lang) => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field.en || field.fr || field.rw || '';
};

const typeConfig = {
  exhibition: { icon: Sparkles, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', path: '/exhibitions' },
  trail: { icon: Compass, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', path: '/trails' },
  artifact: { icon: ImageIcon, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', path: '/artifacts' },
};

const typeFilters = ['all', 'exhibition', 'trail', 'artifact'];

const quickCategories = [
  { key: 'exhibitions', icon: Landmark, label: 'Exhibitions', path: '/exhibitions' },
  { key: 'artifacts', icon: ImageIcon, label: 'Artifacts', path: '/artifacts' },
  { key: 'trails', icon: Map, label: 'Trails', path: '/trails' },
  { key: 'stories', icon: BookOpen, label: 'Stories', path: '/stories' },
];

const suggestedSearches = [
  'Richard Kandt', 'Natural History', 'Taxonomy', 'Rwanda Heritage', 'Colonial Era', 'Butterflies',
];

const SearchPage = () => {
  const { t, lang } = useLanguage();

  // ── Text Search State ──
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);

  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('recentSearches') || '[]');
    } catch {
      return [];
    }
  });

  // ── Image Identification State ──
  const [scanMode, setScanMode] = useState(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [identifying, setIdentifying] = useState(false);
  const [narrating, setNarrating] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [scanError, setScanError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Search Mode Toggle ──
  const [activeTab, setActiveTab] = useState('text');

  useEffect(() => {
    if (activeTab === 'text') inputRef.current?.focus();
  }, [activeTab]);

  // ── Text Search Logic ──
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const doSearch = useCallback(async () => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const params = { q: debouncedQuery };
      if (typeFilter !== 'all') params.type = typeFilter;
      const { data } = await globalSearch(params);
      setResults(Array.isArray(data) ? data : data?.results || []);

      const updated = [debouncedQuery, ...recentSearches.filter(s => s !== debouncedQuery)].slice(0, 8);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch {
      toast.error('Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, typeFilter]);

  useEffect(() => { doSearch(); }, [doSearch]);

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getResultLink = (result) => {
    const type = result.type || result.entityType;
    const config = typeConfig[type];
    if (!config) return '#';
    return `${config.path}/${result._id || result.id}`;
  };

  // ── Image Identification Logic ──
  const startCamera = useCallback(async () => {
    setScanMode('camera');
    setScanResult(null);
    setAudioUrl(null);
    setScanError('');
    setPreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setScanError(t('scanner.cameraError'));
    }
  }, [t]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const capturedFile = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setFile(capturedFile);
      setPreview(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg', 0.85);
  }, [stopCamera]);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setScanMode('upload');
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setScanResult(null);
    setAudioUrl(null);
    setScanError('');
  };

  const handleIdentify = async () => {
    if (!file) return;
    setIdentifying(true);
    setScanError('');
    setScanResult(null);
    setAudioUrl(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await aiIdentifyVisitor(formData);
      setScanResult(data);

      if (data.description) {
        setNarrating(true);
        try {
          let payload;
          if (data.matched && data.entityId) {
            payload = data.entityType === 'artifact'
              ? { artifactId: data.entityId }
              : { exhibitionId: data.entityId };
          } else {
            payload = { text: data.description };
          }
          const blobUrl = await aiNarrateVisitorStream(payload);
          setAudioUrl(blobUrl);
        } catch {
          // Narration failed silently
        } finally {
          setNarrating(false);
        }
      }
    } catch (err) {
      setScanError(err.response?.data?.message || t('scanner.identifyError'));
    } finally {
      setIdentifying(false);
    }
  };

  const handleScanReset = () => {
    stopCamera();
    setScanMode(null);
    setPreview(null);
    setFile(null);
    setScanResult(null);
    setAudioUrl(null);
    setScanError('');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const switchTab = (tab) => {
    if (tab !== 'image') handleScanReset();
    setActiveTab(tab);
  };

  const fullAudioUrl = audioUrl ? (audioUrl.startsWith('http') ? audioUrl : `${API_BASE}${audioUrl}`) : null;

  const grouped = {};
  results.forEach(r => {
    const type = r.type || r.entityType || 'other';
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(r);
  });

  return (
    <div className="page-container max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
          <SearchIcon size={28} className="text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold dark:text-white mb-2">{t('search.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">{t('search.subtitle')}</p>
      </div>

      {/* Tab Switch */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-1.5 mb-8 max-w-md mx-auto">
        <button
          onClick={() => switchTab('text')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'text'
              ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <SearchIcon size={16} />
          {t('search.textSearch') || 'Text Search'}
        </button>
        <button
          onClick={() => switchTab('image')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'image'
              ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Camera size={16} />
          {t('search.imageSearch') || 'Image Search'}
        </button>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* TEXT SEARCH TAB */}
      {/* ═══════════════════════════════════════ */}
      {activeTab === 'text' && (
        <>
          {/* Search Input */}
          <div className="relative mb-6">
            <SearchIcon size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full pl-12 pr-10 py-4 text-lg border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800/80 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition shadow-sm"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            )}
          </div>

          {/* Type Filter Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
            {typeFilters.map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  typeFilter === type
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {type === 'all' ? t('search.allTypes') : type.charAt(0).toUpperCase() + type.slice(1) + 's'}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && <CardGridSkeleton count={3} />}

          {/* Results */}
          {!loading && searched && results.length > 0 && (
            <div className="space-y-8">
              {Object.entries(grouped).map(([type, items]) => {
                const config = typeConfig[type] || { icon: SearchIcon, color: 'bg-slate-100 text-slate-600' };
                const TypeIcon = config.icon;
                return (
                  <div key={type}>
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <TypeIcon size={16} />
                      {type.charAt(0).toUpperCase() + type.slice(1)}s ({items.length})
                    </h3>
                    <div className="space-y-2">
                      {items.map((result, i) => (
                        <Link
                          key={result._id || i}
                          to={getResultLink(result)}
                          className="flex items-start gap-4 p-4 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all group"
                        >
                          <span className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold ${config.color}`}>
                            {type}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                              {getLocalizedText(result.title || result.name, lang)}
                            </h4>
                            {(result.description || result.shortDescription) && (
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                {getLocalizedText(result.shortDescription || result.description, lang)}
                              </p>
                            )}
                          </div>
                          <ArrowRight size={16} className="text-slate-400 flex-shrink-0 mt-1 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {!loading && searched && results.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                <SearchIcon size={36} className="text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-lg font-medium text-slate-500 dark:text-slate-400">{t('search.noResults')}</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 mb-5">
                {t('search.tryImage') || 'Try searching with an image instead'}
              </p>
              <button
                onClick={() => switchTab('image')}
                className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-amber-700 transition shadow-md shadow-amber-600/25"
              >
                <Camera size={16} />
                {t('search.imageSearch') || 'Image Search'}
              </button>
            </div>
          )}

          {/* Recent Searches */}
          {!searched && recentSearches.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={14} />
                  {t('search.recentSearches')}
                </h3>
                <button onClick={clearRecent} className="text-xs text-slate-400 hover:text-red-500 transition">
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(s)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-sm hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-400 transition"
                  >
                    <Clock size={12} />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State — Quick Browse + Suggestions */}
          {!searched && (
            <div className="space-y-8">
              {/* Quick Browse Categories */}
              <div>
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                  {t('search.quickBrowse') || 'Quick Browse'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {quickCategories.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <Link
                        key={cat.key}
                        to={cat.path}
                        className="group flex flex-col items-center gap-2 rounded-2xl p-5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-md transition-all"
                      >
                        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon size={24} className="text-amber-600" />
                        </div>
                        <span className="font-semibold text-sm dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{cat.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Suggested Searches */}
              <div>
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                  {t('search.suggested') || 'Popular Searches'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {suggestedSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 rounded-full text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700/50 hover:border-amber-300 dark:hover:border-amber-600/50 transition-all"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Search CTA */}
              <div className="rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 p-6">
                <div className="flex items-center gap-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Camera size={24} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold dark:text-white mb-1">{t('search.imageSearch') || 'Image Search'}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {t('search.orUseImage') || "Don't know the name? Identify an exhibit by photo."}
                    </p>
                  </div>
                  <button
                    onClick={() => switchTab('image')}
                    className="flex-shrink-0 px-5 py-2.5 bg-amber-600 text-white rounded-full text-sm font-semibold hover:bg-amber-700 transition"
                  >
                    {t('search.tryIt') || 'Try it'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* IMAGE SEARCH TAB */}
      {/* ═══════════════════════════════════════ */}
      {activeTab === 'image' && (
        <>
          {/* Mode selection — capture or upload */}
          {!preview && !scanMode && (
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
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </div>
          )}

          {/* Camera view */}
          {scanMode === 'camera' && !preview && (
            <div className="mb-6">
              <div className="relative rounded-2xl overflow-hidden bg-black">
                <video ref={videoRef} autoPlay playsInline className="w-full h-64 sm:h-80 md:h-[400px] object-cover" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-56 border-2 border-white/50 rounded-2xl" />
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <button onClick={capturePhoto} className="w-16 h-16 rounded-full bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700 transition shadow-lg">
                  <Camera size={28} />
                </button>
                <button onClick={() => { stopCamera(); setScanMode(null); }} className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition">
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
                <img src={preview} alt="Captured" className="w-full h-64 sm:h-80 md:h-[400px] object-cover" />
                {identifying && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                    <Loader2 size={48} className="text-amber-500 animate-spin" />
                    <p className="text-white mt-3 font-medium">{t('scanner.analyzing')}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-3 mt-4">
                {!scanResult && (
                  <button
                    onClick={handleIdentify}
                    disabled={identifying}
                    className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-amber-700 transition disabled:opacity-50 shadow-md shadow-amber-600/25"
                  >
                    <SearchIcon size={18} />
                    {identifying ? t('scanner.analyzing') : t('scanner.identify')}
                  </button>
                )}
                <button
                  onClick={handleScanReset}
                  className="inline-flex items-center gap-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-full font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                >
                  <RotateCcw size={18} />
                  {t('scanner.tryAnother')}
                </button>
              </div>
            </div>
          )}

          {/* Scan error */}
          {scanError && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-xl mb-6 text-center">
              {scanError}
            </div>
          )}

          {/* Identification results */}
          {scanResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                  scanResult.matched
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                }`}>
                  <SearchIcon size={14} />
                  {scanResult.matched ? t('scanner.matchFound') : t('scanner.noMatch')}
                  {scanResult.confidence !== 'none' && ` · ${scanResult.confidence}`}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/50">
                <h3 className="font-semibold text-lg dark:text-white mb-3 flex items-center gap-2">
                  <Volume2 size={18} className="text-amber-600" />
                  {t('scanner.narration')}
                </h3>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{scanResult.description}</p>

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

              {scanResult.entity && (
                <Link
                  to={`/${scanResult.entityType === 'artifact' ? 'artifacts' : 'exhibitions'}/${scanResult.entity._id}`}
                  className="block bg-white dark:bg-slate-800/60 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all group"
                >
                  <div className="flex gap-4 p-4">
                    {(scanResult.entity.coverImage || scanResult.entity.images?.[0]) && (
                      <img
                        src={(() => {
                          const img = scanResult.entity.coverImage || scanResult.entity.images?.[0]?.url || scanResult.entity.images?.[0];
                          return img?.startsWith?.('http') ? img : `${API_BASE}${img}`;
                        })()}
                        alt={getLocalizedText(scanResult.entity.title || scanResult.entity.name, lang)}
                        className="w-24 h-24 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-1 ${
                        scanResult.entityType === 'artifact'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                      }`}>
                        {scanResult.entityType}
                      </span>
                      <h4 className="font-bold dark:text-white group-hover:text-amber-600 transition">
                        {getLocalizedText(scanResult.entity.title || scanResult.entity.name, lang)}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {getLocalizedText(scanResult.entity.shortDescription || scanResult.entity.description, lang)}
                      </p>
                      {scanResult.entity.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {scanResult.entity.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 font-medium">{t('scanner.viewFull')} →</p>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          )}

          {/* How it works — idle state */}
          {!scanMode && !preview && !scanResult && (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50">
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
        </>
      )}
    </div>
  );
};

export default SearchPage;
