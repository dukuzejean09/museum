import { useState, useEffect } from 'react';
import { fetchAnalytics } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Presentation, Gem, MapPin, Users, MessageSquare, CalendarDays, ClipboardList, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data } = await fetchAnalytics();
        setStats(data);
      } catch (err) {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!stats) {
    return (
      <div className="text-center py-16 text-slate-500 dark:text-slate-400">
        <p>Failed to load dashboard data. Please try again.</p>
      </div>
    );
  }

  const allCards = [
    { label: 'Exhibitions', count: stats?.exhibitionCount || 0, icon: Presentation, color: 'bg-blue-500', roles: ['admin', 'guide'] },
    { label: 'Artifacts', count: stats?.artifactCount || 0, icon: Gem, color: 'bg-indigo-500', roles: ['admin', 'guide'] },
    { label: 'Trails', count: stats?.trailCount || 0, icon: MapPin, color: 'bg-green-500', roles: ['admin', 'guide'] },
    { label: 'Stories', count: stats?.storyCount || 0, icon: BookOpen, color: 'bg-pink-500', roles: ['admin', 'guide'] },
    { label: 'Guides', count: stats?.guideCount || 0, icon: Users, color: 'bg-purple-500', roles: ['admin'] },
    { label: 'Bookings', count: stats?.bookingCount || 0, icon: CalendarDays, color: 'bg-orange-500', roles: ['admin', 'guide'] },
    { label: 'Surveys', count: stats?.surveyCount || 0, icon: ClipboardList, color: 'bg-cyan-500', roles: ['admin'] },
    { label: 'Messages', count: stats?.messageCount || 0, icon: MessageSquare, color: 'bg-amber-500', roles: ['admin', 'guide'] },
  ];

  const cards = allCards.filter(c => c.roles.includes(isAdmin ? 'admin' : 'guide'));
  const chartData = cards.map(({ label, count }) => ({ name: label, count }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map(({ label, count, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 flex items-center gap-4">
            <div className={`${color} text-white p-3 rounded-lg`}>
              <Icon size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">Content Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#d97706" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Messages */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">Recent Messages</h2>
          {stats?.recentMessages?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentMessages.map((msg) => (
                <div key={msg._id} className="border border-slate-100 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{msg.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{msg.email}</p>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">{msg.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">No messages yet.</p>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">Recent Bookings</h2>
          {stats?.recentBookings?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentBookings.map((b) => (
                <div key={b._id} className="border border-slate-100 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{b.visitorName}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Guide: {b.guideId?.name || 'N/A'}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      b.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                      b.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                      'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                    {new Date(b.date).toLocaleDateString()} at {b.time} — {b.groupSize} people
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">No bookings yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
