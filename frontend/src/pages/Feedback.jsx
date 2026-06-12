import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchExhibitions, createSurvey, sendMessage } from '../api';
import { Star, CheckCircle, ClipboardList, MessageSquare, MapPin, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getLocalizedText = (field, lang = 'en') => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field.en || field.fr || field.rw || '';
};

const StarRating = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(star => (
      <button key={star} type="button" onClick={() => onChange(star)} className="focus:outline-none">
        <Star size={32} className={star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'} />
      </button>
    ))}
  </div>
);

const Feedback = () => {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState('survey');
  const [exhibitions, setExhibitions] = useState([]);
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [messageSubmitted, setMessageSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [surveyForm, setSurveyForm] = useState({
    visitorName: '', overallRating: 0, favoriteExhibition: '',
    visitDuration: '', wouldRecommend: true, comments: '',
  });

  const [msgForm, setMsgForm] = useState({ name: '', email: '', message: '', exhibitionId: '' });

  useEffect(() => {
    fetchExhibitions({ status: 'published' })
      .then(res => {
        const data = res.data;
        setExhibitions(Array.isArray(data) ? data : data?.exhibitions || data?.docs || []);
      })
      .catch(() => {});
  }, []);

  // Survey handlers
  const handleSurveyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSurveyForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSurveySubmit = async (e) => {
    e.preventDefault();
    if (surveyForm.overallRating === 0) { toast.error(t('survey.ratingRequired')); return; }
    setSubmitting(true);
    try {
      await createSurvey(surveyForm);
      setSurveySubmitted(true);
      toast.success(t('survey.successToast'));
    } catch { toast.error(t('survey.errorToast')); }
    finally { setSubmitting(false); }
  };

  // Message handlers
  const handleMsgChange = (e) => setMsgForm({ ...msgForm, [e.target.name]: e.target.value });

  const handleMsgSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...msgForm };
      if (!payload.exhibitionId) delete payload.exhibitionId;
      await sendMessage(payload);
      setMessageSubmitted(true);
      setMsgForm({ name: '', email: '', message: '', exhibitionId: '' });
      toast.success(t('chat.sent'));
      setTimeout(() => setMessageSubmitted(false), 3000);
    } catch { toast.error(t('chat.errorToast')); }
    finally { setSubmitting(false); }
  };

  const inputClass = "w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition";

  // Survey success screen
  if (surveySubmitted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center bg-white dark:bg-slate-900 rounded-2xl p-10 shadow-sm border border-slate-200 dark:border-slate-700 max-w-md">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold dark:text-white mb-2">{t('survey.thanks')}</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{t('survey.thanksMsg')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/exhibitions" className="inline-flex items-center justify-center gap-2 bg-amber-600 text-white px-6 py-2 rounded-xl hover:bg-amber-700 transition font-semibold">
              <Sparkles size={16} /> {t('nav.exhibitions')}
            </Link>
            <Link to="/map" className="inline-flex items-center justify-center gap-2 border border-amber-600 text-amber-700 dark:text-amber-400 px-6 py-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition font-semibold">
              <MapPin size={16} /> {t('nav.map')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'survey', label: t('survey.title'), icon: ClipboardList },
    { id: 'contact', label: t('chat.title'), icon: MessageSquare },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
          <ClipboardList size={32} className="text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold dark:text-white">{t('nav.feedback')}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">{t('survey.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-1 mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
              tab === id
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Survey Tab */}
      {tab === 'survey' && (
        <form onSubmit={handleSurveySubmit} className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-slate-300">{t('survey.name')}</label>
            <input type="text" name="visitorName" value={surveyForm.visitorName} onChange={handleSurveyChange} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 dark:text-slate-300">{t('survey.overall')} *</label>
            <StarRating value={surveyForm.overallRating} onChange={(val) => setSurveyForm(prev => ({ ...prev, overallRating: val }))} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-slate-300">{t('survey.favorite')}</label>
            <select name="favoriteExhibition" value={surveyForm.favoriteExhibition} onChange={handleSurveyChange} className={inputClass}>
              <option value="">{t('survey.selectExhibit')}</option>
              {exhibitions.map(e => <option key={e._id} value={getLocalizedText(e.title, lang)}>{getLocalizedText(e.title, lang)}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-slate-300">{t('survey.duration')}</label>
            <select name="visitDuration" value={surveyForm.visitDuration} onChange={handleSurveyChange} className={inputClass}>
              <option value="">{t('survey.selectDuration')}</option>
              <option value="Less than 30 minutes">{t('survey.duration30')}</option>
              <option value="30 minutes - 1 hour">{t('survey.duration1h')}</option>
              <option value="1 - 2 hours">{t('survey.duration2h')}</option>
              <option value="More than 2 hours">{t('survey.durationMore')}</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" name="wouldRecommend" checked={surveyForm.wouldRecommend} onChange={handleSurveyChange}
              className="w-5 h-5 text-amber-600 rounded border-slate-300" id="recommend" />
            <label htmlFor="recommend" className="dark:text-slate-300">{t('survey.recommend')}</label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-slate-300">{t('survey.comments')}</label>
            <textarea name="comments" value={surveyForm.comments} onChange={handleSurveyChange} rows="4"
              placeholder={t('survey.commentsPlaceholder')} className={inputClass} />
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-amber-600 text-white py-3 rounded-xl hover:bg-amber-700 transition font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? t('common.submitting') : t('survey.submit')}
          </button>
        </form>
      )}

      {/* Contact Tab */}
      {tab === 'contact' && (
        <>
          {messageSubmitted && (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-xl mb-6 text-center font-medium">
              {t('chat.sent')}
            </div>
          )}
          <form onSubmit={handleMsgSubmit} className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <input type="text" name="name" placeholder={t('chat.name')} value={msgForm.name} onChange={handleMsgChange} required className={inputClass} />
            <input type="email" name="email" placeholder={t('chat.email')} value={msgForm.email} onChange={handleMsgChange} required className={inputClass} />
            <select name="exhibitionId" value={msgForm.exhibitionId} onChange={handleMsgChange} className={inputClass}>
              <option value="">General question (no specific exhibition)</option>
              {exhibitions.map(e => <option key={e._id} value={e._id}>{getLocalizedText(e.title, lang)}</option>)}
            </select>
            <textarea name="message" rows="5" placeholder={t('chat.message')} value={msgForm.message} onChange={handleMsgChange} required className={inputClass}></textarea>
            <button type="submit" disabled={submitting} className="w-full bg-amber-600 text-white px-6 py-3 rounded-xl hover:bg-amber-700 transition font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? t('common.submitting') : t('chat.send')}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Feedback;
