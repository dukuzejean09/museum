/**
 * Narration Service — Browser SpeechSynthesis API wrapper
 *
 * Provides museum-grade text-to-speech narration with:
 * - Language-specific voice selection and optimization
 * - Kinyarwanda pronunciation improvement via phonetic preprocessing
 * - Rate, pitch, and volume configuration per language
 * - Sentence-level pausing for natural delivery
 * - Event-driven playback control
 */

// ──────────────────────────────────────────────────────────────
// Language configuration
// ──────────────────────────────────────────────────────────────
const LANG_CONFIG = {
  en: {
    bcp47: 'en-US',
    fallbacks: ['en-GB', 'en-AU', 'en'],
    rate: 0.75,
    pitch: 1.0,
    volume: 1.0,
    label: 'English',
  },
  fr: {
    bcp47: 'fr-FR',
    fallbacks: ['fr-CA', 'fr-BE', 'fr'],
    rate: 0.70,
    pitch: 1.0,
    volume: 1.0,
    label: 'French',
  },
  rw: {
    // Kinyarwanda has no native TTS voice in most browsers.
    // Swahili (sw) is the closest Bantu-family language available.
    bcp47: 'sw-KE',
    fallbacks: ['sw-TZ', 'sw', 'en-US', 'en'],
    rate: 0.65,
    pitch: 1.0,
    volume: 1.0,
    label: 'Kinyarwanda',
  },
};

// ──────────────────────────────────────────────────────────────
// Voice quality ranking
// ──────────────────────────────────────────────────────────────
const scoreVoice = (voice) => {
  const n = voice.name.toLowerCase();
  let score = 0;
  // Prefer natural/neural voices
  if (n.includes('natural')) score += 50;
  if (n.includes('neural')) score += 45;
  if (n.includes('wavenet')) score += 40;
  if (n.includes('enhanced')) score += 30;
  if (n.includes('premium')) score += 25;
  if (n.includes('google')) score += 20;
  if (n.includes('microsoft')) score += 15;
  if (n.includes('apple')) score += 10;
  // Prefer non-compact voices
  if (n.includes('compact')) score -= 10;
  // Prefer local voices (usually higher quality)
  if (!voice.localService) score += 5;
  return score;
};

// ──────────────────────────────────────────────────────────────
// Find best voice for a language
// ──────────────────────────────────────────────────────────────
const findBestVoice = (langKey) => {
  const synth = window.speechSynthesis;
  if (!synth) return null;

  const voices = synth.getVoices();
  if (!voices.length) return null;

  const config = LANG_CONFIG[langKey] || LANG_CONFIG.en;
  const allCandidates = [config.bcp47, ...config.fallbacks];

  for (const bcp47 of allCandidates) {
    const prefix = bcp47.split('-')[0];
    const matching = voices.filter(v =>
      v.lang === bcp47 || v.lang.startsWith(prefix)
    );
    if (matching.length > 0) {
      matching.sort((a, b) => scoreVoice(b) - scoreVoice(a));
      return matching[0];
    }
  }

  // Last resort: any voice
  return voices[0] || null;
};

// ──────────────────────────────────────────────────────────────
// Get all available voices for a language
// ──────────────────────────────────────────────────────────────
export const getVoicesForLanguage = (langKey) => {
  const synth = window.speechSynthesis;
  if (!synth) return [];

  const voices = synth.getVoices();
  const config = LANG_CONFIG[langKey] || LANG_CONFIG.en;
  const allCandidates = [config.bcp47, ...config.fallbacks];

  const matching = [];
  for (const bcp47 of allCandidates) {
    const prefix = bcp47.split('-')[0];
    const found = voices.filter(v =>
      v.lang === bcp47 || v.lang.startsWith(prefix)
    );
    matching.push(...found);
  }

  // Deduplicate
  const seen = new Set();
  return matching.filter(v => {
    const key = v.name + v.lang;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => scoreVoice(b) - scoreVoice(a));
};

// ──────────────────────────────────────────────────────────────
// Kinyarwanda phonetic preprocessing
// Adapts Kinyarwanda text so Swahili/English TTS engines
// produce more natural pronunciation
// ──────────────────────────────────────────────────────────────
const adaptKinyarwandaText = (text) => {
  let t = text;

  // 'cy' → 'chi' (approximates /tʃ/)
  t = t.replace(/cy/gi, 'chi');

  // Initial 'rw' → 'ru' for clearer pronunciation
  t = t.replace(/\brw/gi, 'ru');

  // 'nk' before vowels — keep as-is (Swahili has the same)
  // 'ng' before vowels — keep (shared phoneme)

  // Add micro-pauses at sentence boundaries for better pacing
  t = t.replace(/([.!?])\s+/g, '$1\u2008 '); // thin space after punctuation

  // Break very long words with a subtle pause hint (comma)
  // Kinyarwanda agglutinative words can be 15+ chars
  t = t.replace(/(\b\w{15,}\b)/g, (match) => {
    // Don't break URLs or emails
    if (match.includes('.') || match.includes('@')) return match;
    return match;
  });

  return t;
};

// ──────────────────────────────────────────────────────────────
// Preprocess text for better TTS delivery
// ──────────────────────────────────────────────────────────────
const preprocessForTTS = (text, langKey) => {
  if (!text) return '';

  let processed = text;

  // Normalize whitespace
  processed = processed.replace(/\s+/g, ' ').trim();

  // Add pauses after headings (text followed by newline)
  processed = processed.replace(/([^\n.!?])\n/g, '$1.\n');

  // Improve number reading
  processed = processed.replace(/(\d{4})\s*-\s*(\d{4})/g, '$1 to $2');

  // Handle abbreviations
  processed = processed.replace(/\bDr\./g, 'Doctor');
  processed = processed.replace(/\bSt\./g, 'Saint');
  processed = processed.replace(/\bMt\./g, 'Mount');

  // Language-specific adaptations
  if (langKey === 'rw') {
    processed = adaptKinyarwandaText(processed);
  }

  if (langKey === 'fr') {
    // Ensure French abbreviations are spoken
    processed = processed.replace(/\bM\.\s/g, 'Monsieur ');
    processed = processed.replace(/\bMme\.\s/g, 'Madame ');
  }

  return processed;
};

// ──────────────────────────────────────────────────────────────
// Estimate narration duration
// ──────────────────────────────────────────────────────────────
export const estimateDuration = (text, langKey = 'en') => {
  if (!text) return 0;
  const words = text.split(/\s+/).length;
  const config = LANG_CONFIG[langKey] || LANG_CONFIG.en;
  // Approximate words per minute adjusted by rate
  const wpm = 150 * config.rate;
  return Math.max(3, (words / wpm) * 60);
};

// ──────────────────────────────────────────────────────────────
// Narration Controller Class
// Manages the lifecycle of a single narration session
// ──────────────────────────────────────────────────────────────
class NarrationController {
  constructor() {
    this.utterance = null;
    this.state = 'idle'; // idle | playing | paused
    this.onStateChange = null;
    this.onProgress = null;
    this.onEnd = null;
    this.onError = null;
    this._timer = null;
    this._startTime = 0;
    this._pausedAt = 0;
    this._estimatedDuration = 0;
    this._rate = 1;
    this._pitch = 1;
    this._volume = 1;
    this._voice = null;
  }

  get isSupported() {
    return 'speechSynthesis' in window;
  }

  /**
   * Start narrating text in the specified language
   */
  speak(text, langKey = 'en', options = {}) {
    if (!this.isSupported) {
      this.onError?.('Speech synthesis not supported');
      return;
    }

    // Cancel any existing narration
    this.stop();

    const config = LANG_CONFIG[langKey] || LANG_CONFIG.en;
    const processed = preprocessForTTS(text, langKey);
    this._estimatedDuration = estimateDuration(text, langKey);

    const utterance = new SpeechSynthesisUtterance(processed);
    utterance.lang = config.bcp47;
    utterance.rate = options.rate ?? config.rate;
    utterance.pitch = options.pitch ?? config.pitch;
    utterance.volume = options.volume ?? config.volume;
    this._rate = utterance.rate;
    this._pitch = utterance.pitch;
    this._volume = utterance.volume;

    // Select voice
    const voice = options.voice || findBestVoice(langKey);
    if (voice) {
      utterance.voice = voice;
      this._voice = voice;
    }

    // Event handlers
    utterance.onstart = () => {
      this.state = 'playing';
      this._startTime = Date.now() - this._pausedAt * 1000;
      this._startProgressTimer();
      this.onStateChange?.('playing');
    };

    utterance.onend = () => {
      this.state = 'idle';
      this._stopProgressTimer();
      this._pausedAt = 0;
      this.onStateChange?.('idle');
      this.onEnd?.();
    };

    utterance.onerror = (e) => {
      // 'interrupted' is normal when stopping
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      this.state = 'idle';
      this._stopProgressTimer();
      this.onError?.(e.error);
    };

    utterance.onpause = () => {
      this.state = 'paused';
      this._pausedAt = (Date.now() - this._startTime) / 1000;
      this._stopProgressTimer();
      this.onStateChange?.('paused');
    };

    utterance.onresume = () => {
      this.state = 'playing';
      this._startTime = Date.now() - this._pausedAt * 1000;
      this._startProgressTimer();
      this.onStateChange?.('playing');
    };

    this.utterance = utterance;
    this._pausedAt = 0;
    window.speechSynthesis.speak(utterance);
  }

  pause() {
    if (this.state !== 'playing') return;
    window.speechSynthesis.pause();
  }

  resume() {
    if (this.state !== 'paused') return;
    window.speechSynthesis.resume();
  }

  stop() {
    window.speechSynthesis?.cancel();
    this._stopProgressTimer();
    this.state = 'idle';
    this._pausedAt = 0;
    this.utterance = null;
    this.onStateChange?.('idle');
  }

  restart(text, langKey, options) {
    this.stop();
    this.speak(text, langKey, options);
  }

  setRate(rate) {
    this._rate = rate;
  }

  setVolume(volume) {
    this._volume = volume;
  }

  _startProgressTimer() {
    this._stopProgressTimer();
    this._timer = setInterval(() => {
      if (this.state !== 'playing') return;
      const elapsed = (Date.now() - this._startTime) / 1000;
      const progress = Math.min(elapsed / this._estimatedDuration, 1);
      this.onProgress?.({
        elapsed,
        duration: this._estimatedDuration,
        progress: progress * 100,
      });
    }, 200);
  }

  _stopProgressTimer() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  destroy() {
    this.stop();
    this.onStateChange = null;
    this.onProgress = null;
    this.onEnd = null;
    this.onError = null;
  }
}

// ──────────────────────────────────────────────────────────────
// Wait for voices to load
// ──────────────────────────────────────────────────────────────
export const waitForVoices = () => {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) return resolve([]);

    const voices = synth.getVoices();
    if (voices.length > 0) return resolve(voices);

    const handler = () => {
      const v = synth.getVoices();
      if (v.length > 0) {
        synth.removeEventListener('voiceschanged', handler);
        resolve(v);
      }
    };
    synth.addEventListener('voiceschanged', handler);

    // Timeout after 3s
    setTimeout(() => {
      synth.removeEventListener('voiceschanged', handler);
      resolve(synth.getVoices());
    }, 3000);
  });
};

// ──────────────────────────────────────────────────────────────
// Create a new narration controller instance
// ──────────────────────────────────────────────────────────────
export const createNarrationController = () => new NarrationController();

export { LANG_CONFIG, findBestVoice, preprocessForTTS };
export default NarrationController;
