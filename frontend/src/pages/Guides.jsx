import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchGuides, createBooking } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import { CalendarDays, Users, CheckCircle, MapPin, X } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Guides = () => {
  const { t } = useLanguage();
  const [guides, setGuides] = useState([]);
  const [bookingGuide, setBookingGuide] = useState(null); // guide selected for booking
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    guideId: '', visitorName: '', visitorEmail: '', visitorPhone: '',
    date: '', time: '', groupSize: 1, message: '',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuides()
      .then(res => {
        const data = res.data;
        setGuides(Array.isArray(data) ? data : data?.data || []);
      })
      .catch(() => setGuides([]))
      .finally(() => setLoading(false));
  }, []);

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

  const inputClass = "w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">{t('guides.title')}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{t('booking.subtitle')}</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      )}

      {!loading && guides.length === 0 && (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p>No guides available at the moment.</p>
        </div>
      )}

      {/* Guide Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guides.map((g) => (
          <div key={g._id} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
            {g.imageUrl && (
              <img src={imageUrl(g.imageUrl)} alt={g.name} className="w-full h-48 object-cover" />
            )}
            <div className="p-5">
              <h2 className="text-xl font-bold dark:text-white">{g.name}</h2>
              <p className="text-slate-600 dark:text-slate-300 mt-2">{g.bio}</p>
              <div className="mt-3">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('guides.languages')}:</p>
                <div className="flex flex-wrap gap-1">
                  {g.languages.map((lang, i) => (
                    <span key={i} className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-xs">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => openBooking(g)}
                className="mt-4 inline-flex items-center gap-1.5 text-sm bg-amber-600 text-white px-4 py-2 rounded-xl hover:bg-amber-700 transition font-medium"
              >
                <CalendarDays size={14} /> {t('nav.bookTour')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {bookingGuide && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeBooking}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold dark:text-white">{t('booking.title')}</h2>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">{t('booking.with')} {bookingGuide.name}</p>
              </div>
              <button onClick={closeBooking} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition">
                <X size={20} />
              </button>
            </div>

            {submitted ? (
              <div className="p-8 text-center">
                <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold dark:text-white mb-2">{t('booking.submitted')}</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">{t('booking.submittedMsg')}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={closeBooking} className="bg-amber-600 text-white px-6 py-2 rounded-xl hover:bg-amber-700 transition font-semibold">
                    {t('booking.bookAnother')}
                  </button>
                  <Link to="/map" onClick={closeBooking} className="inline-flex items-center justify-center gap-2 border border-amber-600 text-amber-700 dark:text-amber-400 px-6 py-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition font-semibold">
                    <MapPin size={16} /> {t('nav.map')}
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">{t('booking.name')} *</label>
                    <input type="text" name="visitorName" value={form.visitorName} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">{t('booking.email')} *</label>
                    <input type="email" name="visitorEmail" value={form.visitorEmail} onChange={handleChange} required className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">{t('booking.phone')}</label>
                  <input type="tel" name="visitorPhone" value={form.visitorPhone} onChange={handleChange} className={inputClass} />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">{t('booking.date')} *</label>
                    <input type="date" name="date" value={form.date} onChange={handleChange} required
                      min={new Date().toISOString().split('T')[0]} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">{t('booking.time')} *</label>
                    <select name="time" value={form.time} onChange={handleChange} required className={inputClass}>
                      <option value="">{t('booking.select')}</option>
                      {['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">{t('booking.groupSize')} *</label>
                    <div className="flex items-center gap-2">
                      <Users size={18} className="text-slate-400" />
                      <input type="number" name="groupSize" value={form.groupSize} onChange={handleChange} min="1" max="50" required className={inputClass} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">{t('booking.specialRequests')}</label>
                  <textarea name="message" value={form.message} onChange={handleChange} rows="2" placeholder={t('booking.specialRequestsPlaceholder')}
                    className={inputClass} />
                </div>

                <button type="submit" disabled={submitting} className="w-full bg-amber-600 text-white py-3 rounded-xl hover:bg-amber-700 transition font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed">
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
