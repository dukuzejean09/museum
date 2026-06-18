import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { fetchGuides, createBooking } from '../api';
import {
 MapPin, Globe, Calendar, Clock, Users, User, Mail, Phone,
 MessageSquare, CheckCircle, ArrowRight, Landmark, Wifi,
} from 'lucide-react';
import toast from 'react-hot-toast';

const timeSlots = [
 '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
 '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
];

const BookVisit = () => {
 const { t } = useLanguage();
 const [visitType, setVisitType] = useState(null); // null = choosing, 'physical', 'online'
 const [guides, setGuides] = useState([]);
 const [loading, setLoading] = useState(false);
 const [submitted, setSubmitted] = useState(false);
 const [refNumber, setRefNumber] = useState('');

 const [form, setForm] = useState({
 visitorName: '',
 visitorEmail: '',
 visitorPhone: '',
 date: '',
 time: '',
 guideId: '',
 groupSize: 1,
 message: '',
 });

 useEffect(() => {
 fetchGuides()
 .then(res => {
 const data = res.data;
 setGuides(Array.isArray(data) ? data : data?.data || []);
 })
 .catch(() => setGuides([]));
 }, []);

 const imgUrl = (path) => {
 if (!path) return null;
 const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
 return path.startsWith('http') ? path : `${base}${path}`;
 };

 const handleChange = (e) => {
 const { name, value } = e.target;
 setForm(prev => ({ ...prev, [name]: value }));
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 setLoading(true);

 try {
 const payload = {
 visitType,
 visitorName: form.visitorName,
 visitorEmail: form.visitorEmail,
 visitorPhone: form.visitorPhone,
 date: form.date,
 groupSize: Number(form.groupSize) || 1,
 message: form.message,
 };

 if (visitType === 'physical') {
 payload.guideId = form.guideId;
 payload.time = form.time;
 }

 const { data } = await createBooking(payload);
 setRefNumber(data.referenceNumber);
 setSubmitted(true);
 toast.success('Booking request submitted!');
 } catch (err) {
 toast.error(err.response?.data?.message || 'Failed to submit booking');
 } finally {
 setLoading(false);
 }
 };

 const today = new Date().toISOString().split('T')[0];

 // Success screen
 if (submitted) {
 return (
 <div className="min-h-[70vh] flex items-center justify-center px-4 bg-slate-950">
 <div className="max-w-md w-full text-center space-y-6">
 <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-900/30">
 <CheckCircle size={40} className="text-amber-400" />
 </div>
 <h2 className="text-2xl font-bold text-slate-100">
 {visitType === 'online' ? 'Access Request Submitted!' : 'Tour Booking Submitted!'}
 </h2>
 <p className="text-slate-300">
 {visitType === 'online'
 ? 'Your online access request is being reviewed. Once approved, you will receive an access code to explore the museum virtually.'
 : 'Your tour booking is pending confirmation. You will receive an email with your booking details.'}
 </p>
 <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-800">
 <p className="text-xs uppercase tracking-wider text-amber-400 font-semibold mb-1">Reference Number</p>
 <p className="text-2xl font-mono font-bold text-amber-200">{refNumber}</p>
 <p className="text-xs text-amber-400 mt-1">Save this for your records</p>
 </div>
 <div className="flex flex-col sm:flex-row gap-3 justify-center">
 <button
 onClick={() => { setSubmitted(false); setVisitType(null); setForm({ visitorName: '', visitorEmail: '', visitorPhone: '', date: '', time: '', guideId: '', groupSize: 1, message: '' }); }}
 className="px-5 py-2.5 rounded-full border border-amber-600 text-amber-300 hover:bg-amber-900/20 font-semibold transition"
 >
 Book Another
 </button>
 <Link
 to="/enter"
 className="px-5 py-2.5 rounded-full bg-amber-600 text-white hover:bg-amber-700 font-semibold transition"
 >
 Back to Gateway
 </Link>
 </div>
 </div>
 </div>
 );
 }

 // Visit type chooser
 if (!visitType) {
 return (
 <div className="min-h-[70vh] flex items-center justify-center px-4 bg-slate-950">
 <div className="max-w-3xl w-full">
 <div className="text-center mb-10">
 <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
 {t('bookVisit.title')}
 </h1>
 <p className="text-slate-400 mt-3 max-w-lg mx-auto">
 {t('bookVisit.subtitle')}
 </p>
 </div>

 <div className="grid sm:grid-cols-2 gap-6">
 {/* Physical Tour */}
 <button
 onClick={() => setVisitType('physical')}
 className="group text-left rounded-2xl border-2 border-slate-700 bg-slate-900 p-8 hover:border-amber-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
 >
 <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white mb-5 group-hover:scale-110 transition-transform">
 <Landmark size={28} />
 </div>
 <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-amber-400 transition-colors">
 {t('bookVisit.physical')}
 </h3>
 <p className="text-sm text-slate-400 leading-relaxed mb-4">
 {t('bookVisit.physicalDesc')}
 </p>
 <ul className="space-y-2 text-sm text-slate-300">
 <li className="flex items-center gap-2"><MapPin size={14} className="text-amber-500" /> On-site guided experience</li>
 <li className="flex items-center gap-2"><Users size={14} className="text-amber-500" /> Groups up to 50 people</li>
 <li className="flex items-center gap-2"><Clock size={14} className="text-amber-500" /> Choose your preferred time</li>
 </ul>
 <div className="mt-5 flex items-center gap-2 text-amber-400 font-semibold text-sm group-hover:gap-3 transition-all">
 Book Tour <ArrowRight size={16} />
 </div>
 </button>

 {/* Online Access */}
 <button
 onClick={() => setVisitType('online')}
 className="group text-left rounded-2xl border-2 border-slate-700 bg-slate-900 p-8 hover:border-amber-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
 >
 <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white mb-5 group-hover:scale-110 transition-transform">
 <Wifi size={28} />
 </div>
 <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-amber-400 transition-colors">
 {t('bookVisit.online')}
 </h3>
 <p className="text-sm text-slate-400 leading-relaxed mb-4">
 {t('bookVisit.onlineDesc')}
 </p>
 <ul className="space-y-2 text-sm text-slate-300">
 <li className="flex items-center gap-2"><Globe size={14} className="text-amber-500" /> Access from anywhere</li>
 <li className="flex items-center gap-2"><Calendar size={14} className="text-amber-500" /> Choose your visit date</li>
 <li className="flex items-center gap-2"><CheckCircle size={14} className="text-amber-500" /> Get access code upon approval</li>
 </ul>
 <div className="mt-5 flex items-center gap-2 text-amber-400 font-semibold text-sm group-hover:gap-3 transition-all">
 Request Access <ArrowRight size={16} />
 </div>
 </button>
 </div>
 </div>
 </div>
 );
 }

 const isPhysical = visitType === 'physical';
 const accent = isPhysical ? 'amber' : 'amber';

 return (
 <div className="max-w-2xl mx-auto px-4 py-10 min-h-screen bg-slate-950">
 {/* Back to chooser */}
 <button
 onClick={() => setVisitType(null)}
 className="text-sm text-slate-400 hover:text-amber-400 mb-6 flex items-center gap-1"
 >
 &larr; Change visit type
 </button>

 <div className="text-center mb-8">
 <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white mb-4`}>
 {isPhysical ? <Landmark size={28} /> : <Wifi size={28} />}
 </div>
 <h1 className="text-2xl font-bold text-slate-100">
 {isPhysical ? t('bookVisit.guidedTour') : t('bookVisit.onlineAccess')}
 </h1>
 <p className="text-slate-400 mt-1 text-sm">
 {isPhysical ? t('bookVisit.guidedTourDesc') : t('bookVisit.onlineAccessDesc')}
 </p>
 </div>

 <form onSubmit={handleSubmit} className="space-y-5 bg-slate-900 rounded-2xl border border-slate-700 p-6 sm:p-8">
 {/* Name & Email */}
 <div className="grid sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-medium text-slate-300 mb-1.5">
 <User size={14} className="inline mr-1" /> Full Name *
 </label>
 <input
 type="text" name="visitorName" value={form.visitorName} onChange={handleChange} required
 className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
 placeholder="Your full name"
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-slate-300 mb-1.5">
 <Mail size={14} className="inline mr-1" /> Email *
 </label>
 <input
 type="email" name="visitorEmail" value={form.visitorEmail} onChange={handleChange} required
 className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
 placeholder="you@example.com"
 />
 </div>
 </div>

 {/* Phone */}
 <div>
 <label className="block text-xs font-medium text-slate-300 mb-1.5">
 <Phone size={14} className="inline mr-1" /> Phone (optional)
 </label>
 <input
 type="tel" name="visitorPhone" value={form.visitorPhone} onChange={handleChange}
 className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
 placeholder="+250 7XX XXX XXX"
 />
 </div>

 {/* Date & Time (time only for physical) */}
 <div className={`grid ${isPhysical ? 'sm:grid-cols-2' : ''} gap-4`}>
 <div>
 <label className="block text-xs font-medium text-slate-300 mb-1.5">
 <Calendar size={14} className="inline mr-1" /> {isPhysical ? 'Visit Date *' : 'Preferred Date *'}
 </label>
 <input
 type="date" name="date" value={form.date} onChange={handleChange} required min={today}
 className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
 />
 </div>
 {isPhysical && (
 <div>
 <label className="block text-xs font-medium text-slate-300 mb-1.5">
 <Clock size={14} className="inline mr-1" /> Time Slot *
 </label>
 <select
 name="time" value={form.time} onChange={handleChange} required
 className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-600 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
 >
 <option value="">Select time</option>
 {timeSlots.map(slot => (
 <option key={slot} value={slot}>{slot}</option>
 ))}
 </select>
 </div>
 )}
 </div>

 {/* Guide selection (physical only) */}
 {isPhysical && (
 <div>
 <label className="block text-xs font-medium text-slate-300 mb-2">
 Choose a Guide *
 </label>
 {guides.length === 0 ? (
 <p className="text-sm text-slate-500">No guides available</p>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
 {guides.map(g => (
 <button
 type="button"
 key={g._id}
 onClick={() => setForm(prev => ({ ...prev, guideId: g._id }))}
 className={`text-center p-3 rounded-xl border-2 transition-all ${
 form.guideId === g._id
 ? 'border-amber-500 bg-amber-900/20 shadow-md'
 : 'border-slate-600 hover:border-amber-500/50'
 }`}
 >
 {g.imageUrl ? (
 <img src={imgUrl(g.imageUrl)} alt={g.name} className="w-12 h-12 rounded-full mx-auto mb-2 object-cover" />
 ) : (
 <div className="w-12 h-12 rounded-full mx-auto mb-2 bg-amber-900/30 flex items-center justify-center">
 <User size={20} className="text-amber-500" />
 </div>
 )}
 <p className="text-sm font-medium text-slate-200 truncate">{g.name}</p>
 </button>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Group size */}
 <div>
 <label className="block text-xs font-medium text-slate-300 mb-1.5">
 <Users size={14} className="inline mr-1" /> {isPhysical ? 'Group Size' : 'Number of People'}
 </label>
 <input
 type="number" name="groupSize" value={form.groupSize} onChange={handleChange} min="1" max="50"
 className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-600 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
 />
 </div>

 {/* Message */}
 <div>
 <label className="block text-xs font-medium text-slate-300 mb-1.5">
 <MessageSquare size={14} className="inline mr-1" /> {isPhysical ? 'Special Requests' : 'Message'} (optional)
 </label>
 <textarea
 name="message" value={form.message} onChange={handleChange} rows={3}
 className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition resize-none"
 placeholder={isPhysical ? 'Any special requirements or accessibility needs...' : 'Tell us about your interest in the museum...'}
 />
 </div>

 {/* Submit */}
 <button
 type="submit"
 disabled={loading || (isPhysical && !form.guideId)}
 className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
 isPhysical
 ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
 : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
 }`}
 >
 {loading
 ? 'Submitting...'
 : isPhysical
 ? 'Book Tour'
 : 'Request Online Access'}
 </button>
 </form>
 </div>
 );
};

export default BookVisit;
