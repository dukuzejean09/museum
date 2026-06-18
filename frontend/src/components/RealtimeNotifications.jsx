import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MessageSquare, CalendarDays, ClipboardList, UserPlus, Bell } from 'lucide-react';

const iconMap = {
  new_booking: CalendarDays,
  new_message: MessageSquare,
  new_survey: ClipboardList,
  new_user: UserPlus,
};

/**
 * Component that listens for real-time notifications and shows toast alerts.
 * Only shows notifications for admin/guide users.
 * Renders nothing — purely side-effect based.
 */
const RealtimeNotifications = () => {
  const { admin } = useAuth();
  const { on } = useSocket() || {};
  const isStaff = !!admin;

  useEffect(() => {
    if (!on || !isStaff) return;

    const unsub = on('notification', (payload) => {
      const data = payload?.data || payload;
      const message = data?.message || 'New update';
      const type = data?.type || 'info';
      const Icon = iconMap[type] || Bell;

      toast(message, {
        icon: <Icon size={18} className="text-amber-600" />,
        duration: 4000,
        style: {
          borderRadius: '12px',
          background: 'var(--toast-bg, #fff)',
          color: 'var(--toast-color, #1e293b)',
          border: '1px solid var(--toast-border, #e2e8f0)',
        },
      });
    });

    return unsub;
  }, [on, isStaff]);

  // Also listen for specific entity events that are relevant for admin awareness
  useEffect(() => {
    if (!on || !isStaff) return;

    const unsubs = [];

    // New booking notification
    unsubs.push(on('booking:created', (payload) => {
      const booking = payload?.data;
      if (booking?.visitorName) {
        toast(`New booking from ${booking.visitorName}`, {
          icon: <CalendarDays size={18} className="text-amber-600" />,
          duration: 4000,
        });
      }
    }));

    // New message notification
    unsubs.push(on('message:created', (payload) => {
      const msg = payload?.data;
      if (msg?.name) {
        toast(`New message from ${msg.name}`, {
          icon: <MessageSquare size={18} className="text-amber-600" />,
          duration: 4000,
        });
      }
    }));

    // New survey notification
    unsubs.push(on('survey:created', (payload) => {
      const survey = payload?.data;
      if (survey) {
        toast(`New survey submitted (${survey.overallRating || '?'}/5)`, {
          icon: <ClipboardList size={18} className="text-amber-600" />,
          duration: 3000,
        });
      }
    }));

    return () => unsubs.forEach(fn => fn());
  }, [on, isStaff]);

  return null;
};

export default RealtimeNotifications;
