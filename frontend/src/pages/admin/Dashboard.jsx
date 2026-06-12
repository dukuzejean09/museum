import { useState, useEffect } from 'react';
import { fetchAnalytics } from '../../api';
import { Presentation, MapPin, Users, MessageSquare, CalendarDays, ClipboardList } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const Dashboard = () => {
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const cards = [
    { label: 'Exhibitions', count: stats?.exhibitionCount || 0, icon: Presentation, color: 'bg-blue-500' },
    { label: 'Trails', count: stats?.trailCount || 0, icon: MapPin, color: 'bg-green-500' },
    { label: 'Guides', count: stats?.guideCount || 0, icon: Users, color: 'bg-purple-500' },
    { label: 'Bookings', count: stats?.bookingCount || 0, icon: CalendarDays, color: 'bg-orange-500' },
    { label: 'Surveys', count: stats?.surveyCount || 0, icon: ClipboardList, color: 'bg-cyan-500' },
    { label: 'Messages', count: stats?.messageCount || 0, icon: MessageSquare, color: 'bg-amber-500' },
  ];

  const chartData = cards.map(({ label, count }) => ({ name: label, count }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map(({ label, count, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
            <div className={`${color} text-white p-3 rounded-lg`}>
              <Icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-800">{count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Content Overview</h2>
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
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Messages</h2>
          {stats?.recentMessages?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentMessages.map((msg) => (
                <div key={msg._id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{msg.name}</p>
                      <p className="text-sm text-gray-500">{msg.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-2 text-sm">{msg.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No messages yet.</p>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Bookings</h2>
          {stats?.recentBookings?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentBookings.map((b) => (
                <div key={b._id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{b.visitorName}</p>
                      <p className="text-sm text-gray-500">Guide: {b.guideId?.name || 'N/A'}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      b.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-gray-500 mt-1 text-sm">
                    {new Date(b.date).toLocaleDateString()} at {b.time} — {b.groupSize} people
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No bookings yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
