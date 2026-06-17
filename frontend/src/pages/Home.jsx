import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Compass, Users, MessageSquare, BookOpen, Search, Clock, MapPin, Globe, Crown, Landmark, TreePine, Flag, Scroll, Gem, Footprints, Sparkles, Heart, ScanLine } from 'lucide-react';
import HomeCt from '../assets/HomeCt.jpeg';
import { useLanguage } from '../i18n/LanguageContext';
import { fetchFeaturedTrails, fetchExhibitions, fetchGuides, fetchArtifacts } from '../api';
import { ImigongoBorder, ImigongoDivider, AgasekeIcon } from '../components/RwandanPatterns';
import { ArtifactSlideshowCard } from '../components/ArtifactSlideshow';

const quickLinks = [
 { to: '/exhibitions', icon: BookOpen, labelKey: 'nav.exhibitions', descKey: 'home.linkExhibitions', color: 'from-amber-500 to-orange-500' },
 { to: '/artifacts', icon: Gem, labelKey: 'nav.artifacts', descKey: 'home.linkArtifacts', color: 'from-emerald-500 to-teal-500' },
 { to: '/trails', icon: Compass, labelKey: 'nav.trails', descKey: 'home.linkTrails', color: 'from-sky-500 to-blue-500' },
 { to: '/ar', icon: ScanLine, labelKey: 'nav.ar', descKey: 'home.linkAR', color: 'from-violet-500 to-purple-500' },
 { to: '/search', icon: Search, labelKey: 'nav.search', descKey: 'home.linkScanner', color: 'from-cyan-500 to-sky-500' },
 { to: '/guides', icon: Users, labelKey: 'nav.guides', descKey: 'home.linkGuides', color: 'from-rose-500 to-pink-500' },
 { to: '/feedback', icon: MessageSquare, labelKey: 'nav.feedback', descKey: 'home.linkFeedback', color: 'from-amber-600 to-yellow-500' },
];

const Home = () => {
 const { t } = useLanguage();
 const [trails, setTrails] = useState([]);
 const [exhibitionCount, setExhibitionCount] = useState(0);
 const [artifactCount, setArtifactCount] = useState(0);
 const [guideCount, setGuideCount] = useState(0);

 const getLocalizedText = (field) => {
 if (!field) return '';
 if (typeof field === 'string') return field;
 return field.en || field.fr || field.rw || '';
 };

 const imgUrl = (path) => {
 if (!path) return null;
 const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
 return path.startsWith('http') ? path : `${base}${path}`;
 };

 useEffect(() => {
 fetchFeaturedTrails()
 .then(res => {
 const data = res.data;
 const list = Array.isArray(data) ? data : data?.data || [];
 setTrails(list);
 })
 .catch(() => {});
 fetchArtifacts({ limit: 1 })
 .then(res => {
 const data = res.data;
 setArtifactCount(data?.pagination?.total || 0);
 })
 .catch(() => {});
 fetchExhibitions()
 .then(res => {
 const data = res.data;
 const list = Array.isArray(data) ? data : data?.data || [];
 setExhibitionCount(list.length);
 })
 .catch(() => {});
 fetchGuides()
 .then(res => {
 const data = res.data;
 const list = Array.isArray(data) ? data : data?.data || [];
 setGuideCount(list.length);
 })
 .catch(() => {});
 }, []);

 const stats = [
 { value: exhibitionCount || '—', labelKey: 'home.statExhibitions', icon: BookOpen },
 { value: artifactCount || '—', labelKey: 'home.statArtifacts', icon: Gem },
 { value: guideCount || '—', labelKey: 'nav.guides', icon: Users },
 { value: '3', labelKey: 'home.statLanguages', icon: Globe },
 ];

 const accentColors = [
 'from-amber-500 to-orange-500',
 'from-emerald-500 to-teal-500',
 'from-violet-500 to-purple-500',
 'from-sky-500 to-blue-500',
 'from-rose-500 to-pink-500',
 'from-amber-600 to-yellow-500',
 ];

 return (
 <main>
 {/* ═══════════════════════════════════════════════════════════════
 1. HERO SECTION
 Kandt House Museum · History & Heritage · QR-AR intro · CTAs · Stats
 ═══════════════════════════════════════════════════════════════ */}
 <section className="relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
 <div className="container relative mx-auto px-4 pt-10 pb-12 lg:pt-16 lg:pb-14">
 <div className="grid gap-10 lg:grid-cols-[1.2fr_.8fr] items-center">
 {/* Left — text */}
 <div className="space-y-5 text-center lg:text-left">
 <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
 {t('home.badge')}
 </span>
 <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl dark:text-white">
 {t('home.title')}
 </h1>
 <p className="text-sm font-medium text-amber-700 dark:text-amber-300 uppercase tracking-widest">
 {t('home.heritageSubtitle')}
 </p>
 <p className="mx-auto max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 lg:mx-0">
 {t('home.subtitle')}
 </p>

 {/* QR-enabled AR intro — compact inline */}
 <div className="flex items-center gap-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur rounded-2xl p-4 border border-slate-200 dark:border-slate-700 max-w-lg mx-auto lg:mx-0">
 <div className="flex-shrink-0 rounded-xl bg-slate-50 dark:bg-slate-700 p-2.5">
 <QRCodeSVG value={window.location.origin + '/exhibitions'} size={72} />
 </div>
 <div className="min-w-0">
 <p className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">
 {t('home.webAr')}
 </p>
 <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
 {t('home.webArDesc')}
 </p>
 </div>
 </div>

 {/* CTA buttons */}
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start pt-1">
 <Link
 to="/book"
 className="inline-flex justify-center rounded-full bg-amber-600 px-6 py-3 text-white shadow hover:bg-amber-700 transition font-semibold"
 >
 {t('home.bookVisit')}
 </Link>
 <Link
 to="/exhibitions"
 className="inline-flex justify-center rounded-full border border-amber-600 px-6 py-3 text-amber-700 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-white/5 transition font-semibold"
 >
 {t('home.viewExhibitions')}
 </Link>
 </div>
 </div>

 {/* Right — hero image */}
 <div className="relative mx-auto w-full max-w-md">
 <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20">
 <img src={HomeCt} alt="Kandt House Museum" className="h-full w-full object-cover" />
 </div>
 </div>
 </div>
 </div>

 {/* Stats bar — integrated at bottom of hero */}
 <div className="relative bg-amber-600 dark:bg-amber-700">
 <div className="container mx-auto px-4 py-5">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
 {stats.map((stat, i) => {
 const Icon = stat.icon;
 return (
 <div key={i} className="flex flex-col items-center gap-1">
 <Icon size={20} className="text-amber-200" />
 <span className="text-2xl font-extrabold text-white">{stat.value}</span>
 <span className="text-xs font-medium text-amber-100 uppercase tracking-wider">{t(stat.labelKey)}</span>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 </section>

 {/* ═══════════════════════════════════════════════════════════════
 2. EXPLORE THE MUSEUM
 Quick-link grid: Exhibitions, Artifacts, Trails, Search, Guides, Feedback
 ═══════════════════════════════════════════════════════════════ */}
 <section className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-16">
 <div className="container mx-auto px-4">
 <h2 className="text-center text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
 {t('home.exploreTitle')}
 </h2>
 <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-10">
 {t('home.exploreSubtitle')}
 </p>

 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {quickLinks.map((link) => {
 const Icon = link.icon;
 return (
 <Link
 key={link.to}
 to={link.to}
 className="group flex items-start gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-xl hover:border-amber-400 hover:-translate-y-1 transition-all duration-300"
 >
 <div className={`flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} group-hover:scale-110 transition-transform duration-300`}>
 <Icon size={22} className="text-white" />
 </div>
 <div>
 <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 transition-colors">
 {t(link.labelKey)}
 </h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1 line-clamp-2">
 {t(link.descKey)}
 </p>
 </div>
 </Link>
 );
 })}
 </div>
 </div>
 </section>

 {/* ═══════════════════════════════════════════════════════════════
 3. GUIDED JOURNEYS / TRAILS
 Featured trail cards with slideshow, difficulty, stops, duration
 ═══════════════════════════════════════════════════════════════ */}
 {trails.length > 0 && (
 <section className="bg-gradient-to-b from-white via-amber-50/30 to-white dark:from-slate-900 dark:via-slate-800/30 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 py-16">
 <div className="container mx-auto px-4">
 <div className="text-center mb-10">
 <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-widest mb-3">
 {t('home.guidedJourneys')}
 </span>
 <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
 {t('home.exploreTrails')}
 </h2>
 <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-lg mx-auto">
 {t('home.trailsDesc')}
 </p>
 </div>

 <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
 {trails.slice(0, 8).map((trail, idx) => {
 const title = getLocalizedText(trail.title);
 const desc = getLocalizedText(trail.description || trail.introduction);
 const cover = imgUrl(trail.coverImage);
 const accent = accentColors[idx % accentColors.length];
 const difficulty = trail.difficulty || 'easy';
 const diffColors = { easy: 'bg-green-500', moderate: 'bg-yellow-500', detailed: 'bg-red-500' };
 return (
 <Link
 key={trail._id}
 to={`/trails/${trail._id}`}
 className="group rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-amber-400 transition-all duration-500"
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
 <div className={`w-full h-full bg-gradient-to-br ${accent} flex items-center justify-center`}>
 <Footprints size={40} className="text-white/70" />
 </div>
 )}
 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
 <div className="absolute top-3 left-3 flex items-center gap-2">
 <span className={`w-2 h-2 rounded-full ${diffColors[difficulty]}`} />
 <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium capitalize">
 {difficulty}
 </span>
 </div>
 <div className="absolute bottom-3 left-4 right-4">
 <h3 className="text-white font-bold text-sm drop-shadow-lg leading-tight line-clamp-2">{title}</h3>
 </div>
 <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
 </div>
 <div className="p-4">
 <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2">
 {trail.estimatedMinutes && (
 <span className="flex items-center gap-1"><Clock size={12} /> {trail.estimatedMinutes} min</span>
 )}
 {trail.stops?.length > 0 && (
 <span className="flex items-center gap-1"><MapPin size={12} /> {trail.stops.length} stops</span>
 )}
 </div>
 <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
 {desc}
 </p>
 <span className={`inline-flex items-center gap-1 mt-3 text-xs font-bold bg-gradient-to-r ${accent} bg-clip-text text-transparent`}>
 {t('home.startTrail')} &rarr;
 </span>
 </div>
 </Link>
 );
 })}
 </div>

 <div className="text-center mt-8">
 <Link
 to="/trails"
 className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-lg shadow-amber-600/25 hover:shadow-amber-600/40 hover:-translate-y-0.5 transition-all duration-300"
 >
 {t('home.viewAllTrails')} &rarr;
 </Link>
 </div>
 </div>
 </section>
 )}

 {/* ═══════════════════════════════════════════════════════════════
 4. MUSEUM COLLECTIONS & HISTORICAL CONTENT
 Six collection categories + Notable Artifacts banner
 ═══════════════════════════════════════════════════════════════ */}
 <section className="bg-gradient-to-b from-amber-50 to-white dark:from-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-700">
 <ImigongoBorder />
 <div className="container mx-auto px-4 py-14">
 <div className="text-center mb-4">
 <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-widest mb-3">
 Kandt House Museum
 </span>
 <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
 {t('home.collectionsTitle')}
 </h2>
 <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-2xl mx-auto text-sm leading-relaxed">
 {t('home.collectionsDesc')}
 </p>
 <ImigongoDivider className="mt-6 text-amber-500 max-w-xs mx-auto" />
 </div>

 <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-10">
 {[
 {
 icon: AgasekeIcon,
 isCustomIcon: true,
 titleKey: 'home.collPreColonial',
 descKey: 'home.collPreColonialDesc',
 gradient: 'from-amber-500 to-orange-500',
 },
 {
 icon: Crown,
 titleKey: 'home.collKingdom',
 descKey: 'home.collKingdomDesc',
 gradient: 'from-violet-500 to-purple-500',
 },
 {
 icon: Landmark,
 titleKey: 'home.collGerman',
 descKey: 'home.collGermanDesc',
 gradient: 'from-sky-500 to-blue-600',
 },
 {
 icon: Scroll,
 titleKey: 'home.collBelgian',
 descKey: 'home.collBelgianDesc',
 gradient: 'from-rose-500 to-pink-600',
 },
 {
 icon: TreePine,
 titleKey: 'home.collNature',
 descKey: 'home.collNatureDesc',
 gradient: 'from-emerald-500 to-teal-500',
 },
 {
 icon: Flag,
 titleKey: 'home.collModern',
 descKey: 'home.collModernDesc',
 gradient: 'from-amber-600 to-yellow-500',
 },
 ].map((item, i) => {
 const IconComp = item.icon;
 return (
 <div
 key={i}
 className="group relative rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-amber-400 transition-all duration-500 overflow-hidden"
 >
 <div className={`h-1 bg-gradient-to-r ${item.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />
 <div className="p-6">
 <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
 {item.isCustomIcon ? <IconComp size={24} className="text-white" /> : <IconComp size={22} className="text-white" />}
 </div>
 <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-amber-600 transition-colors">
 {t(item.titleKey)}
 </h3>
 <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
 {t(item.descKey)}
 </p>
 </div>
 </div>
 );
 })}
 </div>

 {/* Notable artifacts banner */}
 <div className="mt-12 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 p-8 text-white">
 <div className="flex flex-col md:flex-row md:items-center gap-6">
 <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30">
 <Gem size={28} className="text-amber-400" />
 </div>
 <div className="flex-1">
 <h3 className="text-lg font-bold text-amber-300 mb-2">{t('home.notableArtifacts')}</h3>
 <p className="text-sm text-slate-300 leading-relaxed">
 {t('home.notableArtifactsDesc')}
 </p>
 </div>
 <Link
 to="/artifacts"
 className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
 >
 {t('home.exploreArtifacts')} &rarr;
 </Link>
 </div>
 </div>
 </div>
 <ImigongoBorder />
 </section>

 {/* ═══════════════════════════════════════════════════════════════
 5. ABOUT THE MUSEUM
 Overview · History of Kandt House · Living Heritage · Visit info
 ═══════════════════════════════════════════════════════════════ */}
 <section className="bg-white dark:bg-slate-900">
 <div className="container mx-auto px-4 py-16">
 <div className="max-w-5xl mx-auto">
 {/* Section header */}
 <div className="text-center mb-12">
 <span className="inline-block px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-widest mb-3">
 {t('home.about')}
 </span>
 <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
 {t('home.aboutTitle')}
 </h2>
 <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-3 max-w-2xl mx-auto">
 {t('home.aboutText')}
 </p>
 </div>

 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
 {/* History of the Kandt House */}
 <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
 <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-4">
 <Landmark size={20} />
 </div>
 <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
 {t('home.historyTitle')}
 </h3>
 <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
 {t('home.historyText')}
 </p>
 </div>

 {/* Living Heritage */}
 <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
 <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4">
 <Heart size={20} />
 </div>
 <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
 {t('home.livingHeritage')}
 </h3>
 <p className="text-sm text-slate-600 leading-relaxed">
 {t('home.livingHeritageDesc')}
 </p>
 </div>

 {/* Visit Information */}
 <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 md:col-span-2 lg:col-span-1">
 <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 mb-4">
 <MapPin size={20} />
 </div>
 <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
 {t('home.visitTitle')}
 </h3>
 <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
 <p>{t('home.visitAddress')}</p>
 <p className="flex items-start gap-2">
 <Clock size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
 <span>{t('home.visitHours')}</span>
 </p>
 <p>{t('home.visitAdmission')}</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>
 </main>
 );
};

export default Home;
