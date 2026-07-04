import { NavLink } from 'react-router-dom';
import {
  Users, Presentation, Gem, CalendarDays, MessageSquare,
  UserCog, LayoutDashboard, FileBarChart
} from 'lucide-react';

const reports = [
  {
    to: '/admin/reports/visitors',
    label: 'Visitor Report',
    description: 'Museum visitation statistics and trends',
    icon: Users,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    to: '/admin/reports/exhibitions',
    label: 'Exhibition Report',
    description: 'Exhibition engagement and visitor stats',
    icon: Presentation,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  {
    to: '/admin/reports/artifacts',
    label: 'Artifact Report',
    description: 'Complete artifact inventory report',
    icon: Gem,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    to: '/admin/reports/bookings',
    label: 'Tour Booking Report',
    description: 'Tour reservations and guide assignments',
    icon: CalendarDays,
    color: 'text-green-400 bg-green-500/10 border-green-500/20',
  },
  {
    to: '/admin/reports/feedback',
    label: 'Feedback Report',
    description: 'Visitor feedback and rating analysis',
    icon: MessageSquare,
    color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  },
  {
    to: '/admin/reports/user-activity',
    label: 'User Activity Report',
    description: 'System activity for staff and administrators',
    icon: UserCog,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
  {
    to: '/admin/reports/summary',
    label: 'Museum Summary Report',
    description: 'Overall system statistics and overview',
    icon: LayoutDashboard,
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  },
];

const ReportsPage = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <FileBarChart size={28} className="text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-slate-400 text-sm">Generate, view, and export museum reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(({ to, label, description, icon: Icon, color }) => (
          <NavLink
            key={to}
            to={to}
            className="group block p-5 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-slate-900 transition"
          >
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <h3 className="text-white font-semibold text-sm group-hover:text-amber-400 transition">
              {label}
            </h3>
            <p className="text-slate-400 text-xs mt-1">{description}</p>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;
