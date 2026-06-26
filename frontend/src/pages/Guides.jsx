import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchGuides, createBooking } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import { CalendarDays, Users, CheckCircle, MapPin, X } from 'lucide-react';
import { CardGridSkeleton } from '../components/ui/LoadingSkeleton';
import toast from 'react-hot-toast';
import { useRealtimeSync } from '../hooks/useRealtimeStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Guides = () => {
 const { t } = useLanguage();
 const [bookingGuide, setBookingGuide] = useState(null);
 const [submitted, setSubmitted] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [form, setForm] = useState({
 guideId: '', visitorName: '', visitorEmail: '', visitorPhone: '',
 date: '', time: '', groupSize: 1, message: '',
 });

 useRealtimeSync('guide', ['guides']);

 const { data: guidesData, isLoading: loading } = useQuery({
   queryKey: ['guides'],
   queryFn: () => fetchGuides().then(res => {
     const data = res.data;
     return Array.isArray(data) ? data : data?.data || [];
   }),
   staleTime: 5 * 60 * 1000,
 });

 const guides = guidesData || [];

 const imageUrl = (path) => path?.startsWith('http') ? path : `${API_BASE}${path}`;

 const openBooking = (guide) => {
 setBookingGuide(guide);
 setForm(prev => ({ ...prev, guideId: guide._id }));
 setSubmitted(false);
 };

 const closeBooking = () => {
 setBookingGuide(null);
 setForm({ guideId: '', visitorName: '', visitorEmail: '', visitorPhone: '', date: '', time: '', groupSize: 1, message: '' });
 setSubmitted(false);
 };

 const handleChange = (e) => {
 const { name, value } = e.target;
 setForm(prev => ({ ...prev, [name]: name === 'groupSize' ? Number(value) : value }));
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (submitting) return;
 setSubmitting(true);
 try {
 await createBooking(form);
 setSubmitted(true);
 toast.success(t('booking.successToast'));
 } catch { toast.error(t('booking.errorToast')); }
 finally { setSubmitting(false); }
 };

 const inputClass = "form-input";

 return (
 <div className="page-container">
 <div className="page-header">
 <div className="page-header-left">
 <div className="page-header-icon">
 <Users size={24} />
 </div>
 <div>
 <h1 className="page-title">{t('guides.title')}</h1>
 <p className="page-subtitle">{t('booking.subtitle')}</p>
 </div>
 </div>
 </div>

 {loading && (
 <CardGridSkeleton />
 )}

 {!loading && guides.length === 0 && (
 <div className="empty-state">
 <Users size={48} className="empty-state-icon" />
 <p className="empty-state-title">No guides available at the moment.</p>
 </div>
 )}

 {/* Guide Cards */}
 <div className="grid-cards">
 {guides.map((g) => (
 <div key={g._id} className="card-flush">
 {g.imageUrl && (
 <img src={imageUrl(g.imageUrl)} alt={g.name} className="w-full h-48 object-cover" />
 )}
 <div className="card-body">
 <h2 className="card-title">{g.name}</h2>
 <p className="card-desc">{g.bio}</p>
 <div className="mt-3">
 <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('guides.languages')}:</p>
 <div className="flex flex-wrap gap-1">
 {g.languages.map((lang, i) => (
 <span key={i} className="tag">
 {lang}
 </span>
 ))}
 </div>
 </div>
 <button
 onClick={() => openBooking(g)}
 className="btn btn-primary btn-md mt-4"
 >
 <CalendarDays size={14} /> {t('nav.bookTour')}
 </button>
 </div>
 </div>
 ))}
 </div>

 {/* Booking Modal */}
 {bookingGuide && (
 <div className="modal-overlay" onClick={closeBooking}>
 <div className="modal-box" onClick={e => e.stopPropagation()}>
 <div className="modal-header">
 <div>
 <h2 className="text-xl font-bold dark:text-white">{t('booking.title')}</h2>
 <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">{t('booking.with')} {bookingGuide.name}</p>
 </div>
 <button onClick={closeBooking} className="btn btn-ghost btn-sm">
 <X size={20} />
 </button>
 </div>

 {submitted ? (
 <div className="modal-body text-center">
 <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
 <h3 className="text-xl font-bold dark:text-white mb-2">{t('booking.submitted')}</h3>
 <p className="text-slate-600 dark:text-slate-400 mb-6">{t('booking.submittedMsg')}</p>
 <div className="flex flex-col sm:flex-row gap-3 justify-center">
 <button onClick={closeBooking} className="btn btn-primary btn-md">
 {t('booking.bookAnother')}
 </button>
 <Link to="/artifacts" onClick={closeBooking} className="btn btn-outline-primary btn-md">
 <MapPin size={16} /> {t('nav.map')}
 </Link>
 </div>
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="modal-body space-y-4">
 <div className="grid sm:grid-cols-2 gap-4">
 <div>
 <label className="form-label">{t('booking.name')} *</label>
 <input type="text" name="visitorName" value={form.visitorName} onChange={handleChange} required className={inputClass} />
 </div>
 <div>
 <label className="form-label">{t('booking.email')} *</label>
 <input type="email" name="visitorEmail" value={form.visitorEmail} onChange={handleChange} required className={inputClass} />
 </div>
 </div>

 <div>
 <label className="form-label">{t('booking.phone')}</label>
 <input type="tel" name="visitorPhone" value={form.visitorPhone} onChange={handleChange} className={inputClass} />
 </div>

 <div className="grid sm:grid-cols-3 gap-4">
 <div>
 <label className="form-label">{t('booking.date')} *</label>
 <input type="date" name="date" value={form.date} onChange={handleChange} required
 min={new Date().toISOString().split('T')[0]} className={inputClass} />
 </div>
 <div>
 <label className="form-label">{t('booking.time')} *</label>
 <select name="time" value={form.time} onChange={handleChange} required className={inputClass}>
 <option value="">{t('booking.select')}</option>
 {['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'].map(t => (
 <option key={t} value={t}>{t}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="form-label">{t('booking.groupSize')} *</label>
 <div className="flex items-center gap-2">
 <Users size={18} className="text-slate-400" />
 <input type="number" name="groupSize" value={form.groupSize} onChange={handleChange} min="1" max="50" required className={inputClass} />
 </div>
 </div>
 </div>

 <div>
 <label className="form-label">{t('booking.specialRequests')}</label>
 <textarea name="message" value={form.message} onChange={handleChange} rows="2" placeholder={t('booking.specialRequestsPlaceholder')}
 className={inputClass} />
 </div>

 <button type="submit" disabled={submitting} className="btn-submit">
 {submitting ? t('common.submitting') : t('booking.submit')}
 </button>
 </form>
 )}
 </div>
 </div>
 )}
 </div>
 );
};

export default Guides;
