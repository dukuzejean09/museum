import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import {
  Compass, Users, MessageSquare, BookOpen, Search, Clock, MapPin,
  Globe, Crown, Landmark, TreePine, Flag, Scroll, Gem, Footprints,
  Heart, ScanLine, ChevronDown, ArrowRight, Sparkles, Eye,
  Camera, Map, Star, Shield, Play,
} from 'lucide-react';
import HomeCt from '../assets/HomeCt.jpeg';
import { useLanguage } from '../i18n/LanguageContext';
import { fetchFeaturedTrails, fetchExhibitions, fetchArtifacts } from '../api';
import { ImigongoBorder, ImigongoDivider, AgasekeIcon } from '../components/RwandanPatterns';
import { ArtifactSlideshowCard } from '../components/ArtifactSlideshow';
import { useRealtimeSync } from '../hooks/useRealtimeStore';
import { useVisitor } from '../context/VisitorContext';
import { useAuth } from '../context/AuthContext';
import { VideoModal } from '../components/VideoModal';
import GatewayBackgroundVideo from '../components/GatewayBackgroundVideo';

/* ═══════════════════════════════════════════════════════════════
   FLOATING GOLDEN PARTICLES — Layer 3
   GPU-accelerated, low-count, subtle
   ═══════════════════════════════════════════════════════════════ */
const GoldenParticles = () => {
  const particles = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: 3 + Math.random() * 5,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 8,
      opacity: 0.4 + Math.random() * 0.5,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full animate-float-particle will-change-transform"
          style={{
            left: p.left,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, rgba(251,191,36,${p.opacity}), transparent)`,
            boxShadow: `0 0 ${p.size * 3}px rgba(251,191,36,${p.opacity * 0.6})`,
            '--duration': `${p.duration}s`,
            '--delay': `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   RWANDA HILLS SILHOUETTE — Layer 1
   Parallax-ready SVG hills at bottom of hero
   ═══════════════════════════════════════════════════════════════ */
const RwandaHills = () => (
  <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-[1]" aria-hidden="true">
    <svg viewBox="0 0 1440 250" className="w-full h-auto" preserveAspectRatio="none">
      {/* Far hills — golden tint */}
      <path
        d="M0,180 C120,100 240,70 360,110 C480,150 540,50 720,80 C900,120 1020,40 1140,70 C1260,110 1380,60 1440,90 L1440,250 L0,250Z"
        fill="rgba(217,119,6,0.08)"
        className="animate-drift-slow"
      />
      {/* Mid hills */}
      <path
        d="M0,190 C180,130 300,155 480,140 C660,125 780,170 960,150 C1140,130 1320,160 1440,145 L1440,250 L0,250Z"
        fill="rgba(15,23,42,0.6)"
      />
      {/* Near hills */}
      <path
        d="M0,210 C200,185 400,200 600,190 C800,180 1000,195 1200,185 C1350,180 1440,190 1440,195 L1440,250 L0,250Z"
        fill="rgb(15,23,42)"
      />
    </svg>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   IMIGONGO PATTERN OVERLAY — Layer 2
   Subtle geometric background pattern
   ═══════════════════════════════════════════════════════════════ */
const ImigongoOverlay = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.12]" aria-hidden="true">
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="imigongo-hero" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <polygon points="30,0 60,30 30,60 0,30" fill="none" stroke="rgba(251,191,36,1)" strokeWidth="0.8" />
          <polygon points="30,10 50,30 30,50 10,30" fill="none" stroke="rgba(251,191,36,0.7)" strokeWidth="0.5" />
          <circle cx="30" cy="30" r="2.5" fill="rgba(251,191,36,0.5)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#imigongo-hero)" />
    </svg>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   HOLOGRAPHIC SCAN LINES — Layer 4 (Museum Technology)
   ═══════════════════════════════════════════════════════════════ */
const HolographicOverlay = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.2]" aria-hidden="true">
    {/* Horizontal scan lines */}
    {[0, 1, 2, 3].map(i => (
      <div
        key={i}
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-scan-sweep"
        style={{ top: `${20 + i * 20}%`, animationDelay: `${i * 0.8}s` }}
      />
    ))}
    {/* Corner nodes */}
    {[[8, 12], [88, 18], [12, 78], [85, 82], [50, 10], [50, 90]].map(([x, y], i) => (
      <div
        key={`node-${i}`}
        className="absolute w-2 h-2 rounded-full bg-amber-400 animate-pulse-glow"
        style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.5}s` }}
      />
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   ANIMATED COUNTER
   Smooth count-up animation when visible
   ═══════════════════════════════════════════════════════════════ */
const AnimatedCounter = ({ value, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);
  const numericValue = typeof value === 'number' ? value : parseInt(value, 10);
  const isNumeric = !isNaN(numericValue) && numericValue > 0;

  useEffect(() => {
    if (!isNumeric || hasAnimated) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 1500;
          const steps = 40;
          const increment = numericValue / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= numericValue) {
              setCount(numericValue);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isNumeric, numericValue, hasAnimated]);

  if (!isNumeric) return <span className="text-3xl md:text-4xl font-black text-white">{value}</span>;

  return (
    <span ref={ref} className="text-3xl md:text-4xl font-black text-white tabular-nums">
      {hasAnimated ? count : 0}{suffix}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCROLL-REVEAL WRAPPER
   Fade-in elements on scroll intersection
   ═══════════════════════════════════════════════════════════════ */
const ScrollReveal = ({ children, className = '', delay = 0 }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   TIMELINE COMPONENT
   Interactive horizontal historical timeline
   ═══════════════════════════════════════════════════════════════ */
const timelineEras = [
  { key: 'ancient', icon: AgasekeIcon, isCustom: true, year: '< 1400', color: 'from-amber-700 to-amber-900' },
  { key: 'kingdom', icon: Crown, year: '1400–1897', color: 'from-amber-600 to-amber-800' },
  { key: 'colonial', icon: Landmark, year: '1897–1962', color: 'from-amber-500 to-amber-700' },
  { key: 'independence', icon: Flag, year: '1962–1994', color: 'from-amber-600 to-amber-800' },
  { key: 'modern', icon: Star, year: '1994–Present', color: 'from-amber-500 to-amber-700' },
];

const TimelineSection = ({ t }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef(null);
  const isPaused = useRef(false);

  // Auto-advance every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused.current) {
        setActiveIdx(prev => (prev + 1) % timelineEras.length);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative bg-slate-950 py-20 overflow-hidden">
      <ImigongoOverlay />
      <div className="container mx-auto px-4 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full glass-gold text-amber-300 text-xs font-bold uppercase tracking-[0.2em] mb-4">
              {t('home.timelineLabel')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              {t('home.timelineTitle')}
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              {t('home.timelineDesc')}
            </p>
          </div>
        </ScrollReveal>

        {/* Timeline track */}
        <div className="relative" ref={scrollRef}>
          {/* Horizontal line */}
          <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-700 ease-out"
              style={{ width: `${((activeIdx + 1) / timelineEras.length) * 100}%` }}
            />
          </div>

          {/* Era nodes */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-2">
            {timelineEras.map((era, idx) => {
              const Icon = era.icon;
              const isActive = idx === activeIdx;
              return (
                <ScrollReveal key={era.key} delay={idx * 100}>
                  <button
                    onClick={() => { setActiveIdx(idx); isPaused.current = true; setTimeout(() => { isPaused.current = false; }, 10000); }}
                    className={`group relative w-full text-left md:text-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-2xl p-4 ${
                      isActive ? 'glass-gold scale-[1.02]' : 'hover:bg-white/5'
                    }`}
                    aria-label={t(`home.era${era.key.charAt(0).toUpperCase() + era.key.slice(1)}`)}
                  >
                    {/* Node dot */}
                    <div className="hidden md:flex justify-center mb-6">
                      <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                        isActive
                          ? 'bg-amber-500 border-amber-400 shadow-lg shadow-amber-500/40 scale-125'
                          : idx <= activeIdx
                            ? 'bg-amber-600 border-amber-500'
                            : 'bg-slate-700 border-slate-600 group-hover:border-amber-500/50'
                      }`} />
                    </div>

                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 transition-all duration-300 bg-gradient-to-br ${era.color} ${
                      isActive ? 'shadow-lg scale-110' : 'opacity-70 group-hover:opacity-100'
                    }`}>
                      {era.isCustom
                        ? <Icon size={22} className="text-white" />
                        : <Icon size={20} className="text-white" />
                      }
                    </div>

                    <h3 className={`text-sm font-bold mb-1 transition-colors ${
                      isActive ? 'text-amber-300' : 'text-slate-300 group-hover:text-white'
                    }`}>
                      {t(`home.era${era.key.charAt(0).toUpperCase() + era.key.slice(1)}`)}
                    </h3>
                    <p className="text-xs text-slate-500">{era.year}</p>
                  </button>
                </ScrollReveal>
              );
            })}
          </div>

          {/* Active era detail card */}
          <ScrollReveal className="mt-8">
            <div className="glass rounded-2xl p-6 md:p-8 max-w-3xl mx-auto transition-all duration-500">
              <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                {t(`home.era${timelineEras[activeIdx].key.charAt(0).toUpperCase() + timelineEras[activeIdx].key.slice(1)}Desc`)}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN HOME COMPONENT
   ═══════════════════════════════════════════════════════════════ */
const Home = () => {
  const { t, getLocalized } = useLanguage();
  const { isAuthenticated } = useVisitor();
  const { admin } = useAuth();
  const hasAuth = isAuthenticated || !!admin;
  const [showVideo, setShowVideo] = useState(false);

  // Real-time sync
  useRealtimeSync('trail', ['featured-trails']);
  useRealtimeSync('exhibition', ['home-exhibitions']);
  useRealtimeSync('artifact', ['home-artifacts']);

  const { data: trailsData } = useQuery({
    queryKey: ['featured-trails'],
    queryFn: () => fetchFeaturedTrails().then(r => { const d = r.data; return Array.isArray(d) ? d : d?.data || []; }),
    staleTime: 5 * 60 * 1000,
    enabled: hasAuth,
  });
  const { data: artifactsData } = useQuery({
    queryKey: ['home-artifacts'],
    queryFn: () => fetchArtifacts({ limit: 1 }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: hasAuth,
  });
  const { data: exhibitionsData } = useQuery({
    queryKey: ['home-exhibitions'],
    queryFn: () => fetchExhibitions().then(r => { const d = r.data; return Array.isArray(d) ? d : d?.data || []; }),
    staleTime: 5 * 60 * 1000,
    enabled: hasAuth,
  });

  const trails = trailsData || [];
  const exhibitionCount = exhibitionsData?.length || 0;
  const artifactCount = artifactsData?.pagination?.total || 0;

  const imgUrl = (path) => {
    if (!path) return null;
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    return path.startsWith('http') ? path : `${base}${path}`;
  };

  const stats = [
    { value: artifactCount || 120, labelKey: 'home.statArtifacts', icon: Gem, suffix: '+' },
    { value: exhibitionCount || 8, labelKey: 'home.statExhibitions', icon: BookOpen, suffix: '' },
    { value: 5, labelKey: 'nav.guides', icon: Users, suffix: '' },
    { value: 3, labelKey: 'home.statLanguages', icon: Globe, suffix: '' },
  ];

  const experiences = [
    { icon: Camera, titleKey: 'home.expAR', descKey: 'home.expARDesc', to: '/ar', gradient: 'from-amber-700 to-amber-900' },
    { icon: Compass, titleKey: 'home.expTours', descKey: 'home.expToursDesc', to: '/trails', gradient: 'from-amber-600 to-amber-800' },
    { icon: BookOpen, titleKey: 'home.expExhibitions', descKey: 'home.expExhibitionsDesc', to: '/exhibitions', gradient: 'from-amber-500 to-amber-700' },
    { icon: Gem, titleKey: 'home.expArchives', descKey: 'home.expArchivesDesc', to: '/artifacts', gradient: 'from-amber-600 to-amber-800' },
  ];

  const culturalHighlights = [
    { icon: AgasekeIcon, isCustom: true, titleKey: 'home.cultureAgaseke', descKey: 'home.cultureAgasekeDesc' },
    { titleKey: 'home.cultureImigongo', descKey: 'home.cultureImigongoDesc' },
    { icon: Heart, titleKey: 'home.cultureConservation', descKey: 'home.cultureConservationDesc' },
    { icon: TreePine, titleKey: 'home.cultureBiodiversity', descKey: 'home.cultureBiodiversityDesc' },
  ];

  return (
    <main className="bg-slate-950 text-white overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════
          1. HERO SECTION — Full-screen immersive
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background video layer */}
        <GatewayBackgroundVideo overlayOpacity={0.45} />
        {/* Decorative overlays */}
        <ImigongoOverlay />
        <GoldenParticles />
        <HolographicOverlay />
        <RwandaHills />

        {/* Hero content */}
        <div className="container relative z-10 mx-auto px-4 py-20 lg:py-0">
          <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr] items-center max-w-7xl mx-auto">
            {/* Left — text content */}
            <div className="stagger-children text-center lg:text-left">
              {/* Badge */}
              <div>
                <span className="inline-flex items-center gap-2 rounded-full glass-gold px-4 py-2 text-sm font-semibold text-amber-300">
                  <Sparkles size={14} className="text-amber-400" />
                  {t('home.badge')}
                </span>
              </div>

              {/* Main heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                <span className="text-white">Kandt House</span>
                <br />
                <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent animate-shimmer">
                  Museum
                </span>
              </h1>

              {/* Tagline */}
              <p className="text-lg sm:text-xl text-amber-200/80 font-medium max-w-xl mx-auto lg:mx-0">
                {t('home.heroTagline')}
              </p>

              {/* Museum story */}
              <p className="text-base text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t('home.heroStory')}
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                <Link
                  to="/book"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-7 py-3.5 text-white font-bold shadow-lg shadow-amber-600/25 hover:shadow-amber-500/40 hover:scale-[1.02] transition-all duration-300"
                >
                  {t('home.bookVisit')}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/exhibitions"
                  className="inline-flex items-center justify-center gap-2 rounded-full glass-gold px-7 py-3.5 text-amber-200 font-semibold hover:bg-amber-500/15 transition-all duration-300"
                >
                  <Eye size={16} />
                  {t('home.viewExhibitions')}
                </Link>
                <button
                  onClick={() => setShowVideo(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-500/30 px-6 py-3.5 text-amber-300/90 font-semibold hover:bg-amber-500/10 hover:border-amber-500/50 transition-all duration-300 group"
                >
                  <span className="w-7 h-7 rounded-full bg-amber-600/80 flex items-center justify-center group-hover:bg-amber-600 transition-colors">
                    <Play size={12} className="text-white ml-0.5" fill="white" />
                  </span>
                  {t('home.watchVideo') || 'Discover the Museum'}
                </button>
              </div>

              {/* Quick trust indicators */}
              <div className="flex items-center gap-6 justify-center lg:justify-start text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><Shield size={12} className="text-amber-500" /> {t('home.trustFree')}</span>
                <span className="flex items-center gap-1.5"><Globe size={12} className="text-amber-500" /> {t('home.trustMultilingual')}</span>
                <span className="flex items-center gap-1.5"><Camera size={12} className="text-amber-500" /> {t('home.trustAR')}</span>
              </div>

              {/* Compact QR Code */}
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="p-1.5 rounded-lg bg-white shadow-md">
                  <QRCodeSVG
                    value={window.location.origin + '/enter'}
                    size={48}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-300">{t('home.entryScan') || 'Scan to Enter'}</p>
                  <p className="text-[10px] text-slate-500">{t('home.entryLabel') || 'Museum Access'}</p>
                </div>
              </div>
            </div>

            {/* Right — hero image with premium frame */}
            <div className="relative mx-auto w-full max-w-md animate-hero-fade-up" style={{ animationDelay: '0.4s' }}>
              <div className="relative rounded-[24px] overflow-hidden border border-amber-500/20 shadow-2xl shadow-amber-900/20">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-br from-amber-500/20 via-transparent to-amber-600/10 rounded-[28px] blur-xl" />
                <img
                  src={HomeCt}
                  alt="Kandt House Museum — Kigali, Rwanda"
                  className="relative w-full h-full object-cover aspect-[4/5]"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                {/* Bottom label */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="glass rounded-xl px-4 py-3">
                    <p className="text-xs font-bold text-amber-300 uppercase tracking-widest">{t('home.heroImageLabel')}</p>
                    <p className="text-xs text-slate-300 mt-0.5">{t('home.heroImageSub')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-scroll-hint z-10">
          <span className="text-xs text-slate-500 uppercase tracking-widest">{t('home.scrollHint')}</span>
          <ChevronDown size={18} className="text-amber-500" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. STATS BAR — Animated counters
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-8 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden="true">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="imigongo-stats" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <polygon points="20,0 40,20 20,40 0,20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#imigongo-stats)" />
          </svg>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <ScrollReveal key={i} delay={i * 100}>
                  <div className="flex flex-col items-center gap-2">
                    <Icon size={22} className="text-amber-100/80" />
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    <span className="text-xs font-semibold text-amber-100/70 uppercase tracking-wider">
                      {t(stat.labelKey)}
                    </span>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. FEATURED EXPERIENCES — AR, Tours, Exhibitions, Archives
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative bg-slate-950 py-20">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-14">
              <span className="inline-block px-4 py-1.5 rounded-full glass-gold text-amber-300 text-xs font-bold uppercase tracking-[0.2em] mb-4">
                {t('home.experiencesLabel')}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
                {t('home.experiencesTitle')}
              </h2>
              <p className="text-slate-400 max-w-lg mx-auto">
                {t('home.experiencesDesc')}
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {experiences.map((exp, i) => {
              const Icon = exp.icon;
              return (
                <ScrollReveal key={exp.titleKey} delay={i * 100}>
                  <Link
                    to={exp.to}
                    className="group relative block rounded-2xl glass overflow-hidden hover:border-amber-500/30 hover:scale-[1.02] transition-all duration-500"
                  >
                    {/* Gradient header */}
                    <div className={`h-32 bg-gradient-to-br ${exp.gradient} flex items-center justify-center relative overflow-hidden`}>
                      <Icon size={40} className="text-white/80 group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
                    </div>
                    <div className="p-5">
                      <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors mb-2">
                        {t(exp.titleKey)}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                        {t(exp.descKey)}
                      </p>
                      <span className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-amber-400 group-hover:text-amber-300">
                        {t('home.explore')} <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Link>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. HISTORICAL PERIODS — Collection cards
          ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#0a0f1f] py-20">
        <ImigongoBorder />
        <div className="container mx-auto px-4 pt-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 rounded-full glass-gold text-amber-300 text-xs font-bold uppercase tracking-[0.2em] mb-4">
                Kandt House Museum
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
                {t('home.collectionsTitle')}
              </h2>
              <p className="text-slate-400 mt-3 max-w-2xl mx-auto text-sm leading-relaxed">
                {t('home.collectionsDesc')}
              </p>
              <ImigongoDivider className="mt-6 text-amber-500 max-w-xs mx-auto" />
            </div>
          </ScrollReveal>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-10">
            {[
              { icon: AgasekeIcon, isCustom: true, titleKey: 'home.collPreColonial', descKey: 'home.collPreColonialDesc', gradient: 'from-amber-700 to-amber-900' },
              { icon: Crown, titleKey: 'home.collKingdom', descKey: 'home.collKingdomDesc', gradient: 'from-amber-600 to-amber-800' },
              { icon: Landmark, titleKey: 'home.collGerman', descKey: 'home.collGermanDesc', gradient: 'from-amber-500 to-amber-700' },
              { icon: Scroll, titleKey: 'home.collBelgian', descKey: 'home.collBelgianDesc', gradient: 'from-amber-600 to-amber-800' },
              { icon: TreePine, titleKey: 'home.collNature', descKey: 'home.collNatureDesc', gradient: 'from-amber-500 to-amber-700' },
              { icon: Flag, titleKey: 'home.collModern', descKey: 'home.collModernDesc', gradient: 'from-amber-600 to-amber-800' },
            ].map((item, i) => {
              const IconComp = item.icon;
              return (
                <ScrollReveal key={i} delay={i * 80}>
                  <div className="group relative rounded-2xl glass overflow-hidden hover:border-amber-500/20 hover:scale-[1.01] transition-all duration-500">
                    {/* Top accent */}
                    <div className={`h-1 bg-gradient-to-r ${item.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className="p-6">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                        {item.isCustom
                          ? <IconComp size={24} className="text-white" />
                          : <IconComp size={22} className="text-white" />
                        }
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                        {t(item.titleKey)}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {t(item.descKey)}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

          {/* Notable artifacts banner */}
          <ScrollReveal className="mt-12">
            <div className="rounded-2xl bg-gradient-to-r from-amber-900/40 to-amber-800/20 glass p-8">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-600/20">
                  <Gem size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-amber-300 mb-2">{t('home.notableArtifacts')}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {t('home.notableArtifactsDesc')}
                  </p>
                </div>
                <Link
                  to="/artifacts"
                  className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white text-sm font-bold shadow-lg shadow-amber-600/20 transition-all duration-300 hover:scale-[1.02]"
                >
                  {t('home.exploreArtifacts')} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
        <div className="mt-10">
          <ImigongoBorder />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          6. TIMELINE — Interactive historical journey
          ═══════════════════════════════════════════════════════════ */}
      <TimelineSection t={t} />

      {/* ═══════════════════════════════════════════════════════════
          7. GUIDED TRAILS
          ═══════════════════════════════════════════════════════════ */}
      {trails.length > 0 && (
        <section className="bg-[#0a0f1f] py-20">
          <div className="container mx-auto px-4">
            <ScrollReveal>
              <div className="text-center mb-12">
                <span className="inline-block px-4 py-1.5 rounded-full glass-gold text-amber-300 text-xs font-bold uppercase tracking-[0.2em] mb-4">
                  {t('home.guidedJourneys')}
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
                  {t('home.exploreTrails')}
                </h2>
                <p className="text-slate-400 mt-2 max-w-lg mx-auto">
                  {t('home.trailsDesc')}
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {trails.slice(0, 8).map((trail, idx) => {
                const title = getLocalized(trail.title);
                const desc = getLocalized(trail.description || trail.introduction);
                const cover = imgUrl(trail.coverImage);
                const difficulty = trail.difficulty || 'easy';
                return (
                  <ScrollReveal key={trail._id} delay={idx * 80}>
                    <Link
                      to={`/trails/${trail._id}`}
                      className="group block rounded-2xl overflow-hidden glass hover:border-amber-500/20 hover:scale-[1.01] transition-all duration-500"
                    >
                      <div className="relative h-44 overflow-hidden">
                        {trail.stops?.some(s => s.artifact?.image || s.artifact?.coverImage) ? (
                          <ArtifactSlideshowCard
                            artifacts={trail.stops.map(s => s.artifact).filter(Boolean)}
                            className="w-full h-full group-hover:scale-110 transition-transform duration-700"
                            interval={3500 + Math.random() * 1500}
                          />
                        ) : cover ? (
                          <img src={cover} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center">
                            <Footprints size={40} className="text-white/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium capitalize">
                            {difficulty}
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-4 right-4">
                          <h3 className="text-white font-bold text-sm drop-shadow-lg leading-tight line-clamp-2">{title}</h3>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                          {trail.estimatedMinutes && (
                            <span className="flex items-center gap-1"><Clock size={12} /> {trail.estimatedMinutes} min</span>
                          )}
                          {trail.stops?.length > 0 && (
                            <span className="flex items-center gap-1"><MapPin size={12} /> {trail.stops.length} stops</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{desc}</p>
                        <span className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-amber-400 group-hover:text-amber-300">
                          {t('home.startTrail')} <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </Link>
                  </ScrollReveal>
                );
              })}
            </div>

            <ScrollReveal className="text-center mt-10">
              <Link
                to="/trails"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold shadow-lg shadow-amber-600/20 hover:scale-[1.02] transition-all duration-300"
              >
                {t('home.viewAllTrails')} <ArrowRight size={14} />
              </Link>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          8. CULTURAL HIGHLIGHTS
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative bg-slate-950 py-20 overflow-hidden">
        <ImigongoOverlay />
        <div className="container relative z-10 mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-14">
              <span className="inline-block px-4 py-1.5 rounded-full glass-gold text-amber-300 text-xs font-bold uppercase tracking-[0.2em] mb-4">
                {t('home.cultureLabel')}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
                {t('home.cultureTitle')}
              </h2>
              <p className="text-slate-400 max-w-lg mx-auto">
                {t('home.cultureDesc')}
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {culturalHighlights.map((item, i) => {
              const Icon = item.icon || Gem;
              return (
                <ScrollReveal key={item.titleKey} delay={i * 100}>
                  <div className="group rounded-2xl glass p-6 hover:border-amber-500/20 hover:scale-[1.01] transition-all duration-500 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 mb-4 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-amber-600/20 transition-all duration-300">
                      {item.isCustom
                        ? <Icon size={26} className="text-white" />
                        : <Icon size={24} className="text-white" />
                      }
                    </div>
                    <h3 className="text-base font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                      {t(item.titleKey)}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {t(item.descKey)}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          9. EXPLORE THE MUSEUM — Quick links
          ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#0a0f1f] py-20">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
                {t('home.exploreTitle')}
              </h2>
              <p className="text-slate-400">
                {t('home.exploreSubtitle')}
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {[
              { to: '/exhibitions', icon: BookOpen, labelKey: 'nav.exhibitions', descKey: 'home.linkExhibitions' },
              { to: '/artifacts', icon: Gem, labelKey: 'nav.artifacts', descKey: 'home.linkArtifacts' },
              { to: '/trails', icon: Compass, labelKey: 'nav.trails', descKey: 'home.linkTrails' },
              { to: '/ar', icon: ScanLine, labelKey: 'nav.ar', descKey: 'home.linkAR' },
              { to: '/search', icon: Search, labelKey: 'nav.search', descKey: 'home.linkScanner' },
              { to: '/feedback', icon: MessageSquare, labelKey: 'nav.feedback', descKey: 'home.linkFeedback' },
            ].map((link, i) => {
              const Icon = link.icon;
              return (
                <ScrollReveal key={link.to} delay={i * 60}>
                  <Link
                    to={link.to}
                    className="group flex items-start gap-4 rounded-2xl glass p-5 hover:border-amber-500/20 hover:scale-[1.01] transition-all duration-500"
                  >
                    <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 group-hover:from-amber-500 group-hover:to-amber-600 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-amber-600/20 transition-all duration-300">
                      <Icon size={22} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                        {t(link.labelKey)}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed mt-1 line-clamp-2">
                        {t(link.descKey)}
                      </p>
                    </div>
                  </Link>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          10. ABOUT THE MUSEUM — Overview, History, Visit Info
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative bg-slate-950 py-20">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <span className="inline-block px-4 py-1.5 rounded-full glass text-slate-300 text-xs font-bold uppercase tracking-[0.2em] mb-4">
                  {t('home.about')}
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
                  {t('home.aboutTitle')}
                </h2>
                <p className="text-slate-400 leading-relaxed mt-3 max-w-2xl mx-auto">
                  {t('home.aboutText')}
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <ScrollReveal delay={0}>
                  <div className="glass rounded-2xl p-6 h-full">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 text-white mb-4">
                      <Landmark size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-3">
                      {t('home.historyTitle')}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {t('home.historyText')}
                    </p>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={100}>
                  <div className="glass rounded-2xl p-6 h-full">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 text-white mb-4">
                      <Heart size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-3">
                      {t('home.livingHeritage')}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {t('home.livingHeritageDesc')}
                    </p>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={200}>
                  <div className="glass rounded-2xl p-6 h-full md:col-span-2 lg:col-span-1">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 text-white mb-4">
                      <MapPin size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-3">
                      {t('home.visitTitle')}
                    </h3>
                    <div className="space-y-3 text-sm text-slate-400">
                      <p>{t('home.visitAddress')}</p>
                      <p className="flex items-start gap-2">
                        <Clock size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <span>{t('home.visitHours')}</span>
                      </p>
                      <p>{t('home.visitAdmission')}</p>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          11. FINAL CTA — Book a visit
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-amber-950/20 to-slate-950" />
        <GoldenParticles />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              {t('home.ctaTitle')}
            </h2>
            <p className="text-slate-400 max-w-md mx-auto mb-8">
              {t('home.ctaDesc')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/book"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-lg shadow-xl shadow-amber-600/25 hover:shadow-amber-500/40 hover:scale-[1.03] transition-all duration-300"
              >
                {t('home.bookVisit')}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/exhibitions"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full glass-gold text-amber-200 font-semibold hover:bg-amber-500/15 transition-all duration-300"
              >
                {t('home.viewExhibitions')}
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Video Modal */}
      <VideoModal
        isOpen={showVideo}
        onClose={() => setShowVideo(false)}
        src="/museum-intro.mp4"
        title={t('home.watchVideoTitle') || 'Kandt House Museum — Introduction'}
      />
    </main>
  );
};

export default Home;
