import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ErrorBoundary from '../../components/ErrorBoundary';
import RealtimeNotifications from '../../components/RealtimeNotifications';
import {
  LayoutDashboard, MapPin, MessageSquare, LogOut,
  CalendarDays, ClipboardList, Menu, X, QrCode,
  Presentation, BookOpen, UserCog, Gem, UserCircle, Users,
  BarChart3, FileCheck, FileBarChart
} from 'lucide-react';

const allSidebarLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'guide'] },
  { to: '/admin/guide-profile', label: 'My Profile', icon: UserCircle, roles: ['admin', 'guide'] },
  { to: '/admin/exhibitions', label: 'Exhibitions', icon: Presentation, roles: ['admin', 'guide'] },
  { to: '/admin/artifacts', label: 'Artifacts', icon: Gem, roles: ['admin', 'guide'] },
  { to: '/admin/stories', label: 'Stories', icon: BookOpen, roles: ['admin', 'guide'] },
  { to: '/admin/trails', label: 'Trails', icon: MapPin, roles: ['admin', 'guide'] },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarDays, roles: ['admin', 'guide'] },
  { to: '/admin/guides', label: 'Guides', icon: Users, roles: ['admin'] },
  { to: '/admin/surveys', label: 'Surveys', icon: ClipboardList, roles: ['admin'] },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare, roles: ['admin', 'guide'] },
  { to: '/admin/access-codes', label: 'Access Codes', icon: QrCode, roles: ['admin', 'guide'] },
  { to: '/admin/evaluation', label: 'Evaluation', icon: FileCheck, roles: ['admin'] },
  { to: '/admin/reports', label: 'Reports', icon: FileBarChart, roles: ['admin'] },
  { to: '/admin/analytics-insights', label: 'Analytics', icon: BarChart3, roles: ['admin'] },
  { to: '/admin/users', label: 'Users', icon: UserCog, roles: ['admin'] },
];

const AdminLayout = () => {
  const { admin, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const location = useLocation();
  const role = admin?.role || 'admin';
  const sidebarLinks = allSidebarLinks.filter((link) => link.roles.includes(role));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Mobile sidebar toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-slate-900 text-white p-2 rounded-lg shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`w-64 bg-slate-900 text-white flex flex-col fixed h-full z-40 transition-transform lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-amber-400">
            {isAdmin ? 'Admin Panel' : 'Guide Panel'}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-400 text-sm">{admin?.username}</p>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
              isAdmin
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-amber-500/20 text-amber-300'
            }`}>
              {role}
            </span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition text-sm font-medium ${
                  isActive
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition w-full text-sm font-medium"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Real-time notifications for staff */}
      <RealtimeNotifications />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8">
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default AdminLayout;
