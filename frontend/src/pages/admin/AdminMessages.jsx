import { useState, useEffect } from 'react';
import { adminFetchMessages, adminDeleteMessage, adminReplyToMessage, adminUpdateMessageStatus } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Send, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const statusColors = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  answered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
};

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyInputs, setReplyInputs] = useState({});
  const [sendingReply, setSendingReply] = useState({});
  const [expanded, setExpanded] = useState({});
  const { isAdmin } = useAuth();

  const loadMessages = async () => {
    try {
      const { data } = await adminFetchMessages();
      setMessages(Array.isArray(data) ? data : data?.data || []);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMessages(); }, []);

  const handleReply = async (msgId) => {
    const text = replyInputs[msgId]?.trim();
    if (!text) return;
    setSendingReply((p) => ({ ...p, [msgId]: true }));
    try {
      const { data } = await adminReplyToMessage(msgId, { message: text });
      setMessages((prev) => prev.map((m) => (m._id === msgId ? data : m)));
      setReplyInputs((p) => ({ ...p, [msgId]: '' }));
      setExpanded((p) => ({ ...p, [msgId]: true }));
      toast.success('Reply sent');
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSendingReply((p) => ({ ...p, [msgId]: false }));
    }
  };

  const handleStatusChange = async (msgId, status) => {
    try {
      const { data } = await adminUpdateMessageStatus(msgId, { status });
      setMessages((prev) => prev.map((m) => (m._id === msgId ? { ...m, status: data.status } : m)));
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message and all replies?')) return;
    try {
      await adminDeleteMessage(id);
      toast.success('Message deleted');
      setMessages((prev) => prev.filter((m) => m._id !== id));
    } catch {
      toast.error('Failed to delete message');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold dark:text-white mb-6">Messages</h1>

      {messages.length === 0 ? (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
          <p>No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg._id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Header */}
              <div className="p-5">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold dark:text-white">{msg.name}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[msg.status || 'open']}`}>
                        {msg.status || 'open'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{msg.email}</p>
                    {msg.exhibitionId && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        About: {msg.exhibitionId.title?.en || msg.exhibitionId.title || 'Exhibition'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{new Date(msg.createdAt).toLocaleString()}</span>
                    <select
                      value={msg.status || 'open'}
                      onChange={(e) => handleStatusChange(msg._id, e.target.value)}
                      className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 dark:text-white"
                    >
                      <option value="open">Open</option>
                      <option value="answered">Answered</option>
                      <option value="closed">Closed</option>
                    </select>
                    {isAdmin && (
                      <button onClick={() => handleDelete(msg._id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-slate-700 dark:text-slate-300 mt-3">{msg.message}</p>
              </div>

              {/* Replies */}
              {msg.replies?.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setExpanded((p) => ({ ...p, [msg._id]: !p[msg._id] }))}
                    className="w-full px-5 py-2 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-1"
                  >
                    {expanded[msg._id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {msg.replies.length} {msg.replies.length === 1 ? 'reply' : 'replies'}
                  </button>
                  {expanded[msg._id] && (
                    <div className="px-5 pb-3 space-y-3">
                      {msg.replies.map((reply, i) => (
                        <div key={i} className="pl-4 border-l-2 border-amber-300 dark:border-amber-600">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm dark:text-white">{reply.responderName}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              reply.responderRole === 'admin'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>
                              {reply.responderRole}
                            </span>
                            <span className="text-xs text-slate-400">{new Date(reply.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{reply.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reply input */}
              <div className="border-t border-slate-100 dark:border-slate-800 p-4 flex gap-2">
                <input
                  type="text"
                  value={replyInputs[msg._id] || ''}
                  onChange={(e) => setReplyInputs((p) => ({ ...p, [msg._id]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleReply(msg._id)}
                  placeholder="Type your reply..."
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <button
                  onClick={() => handleReply(msg._id)}
                  disabled={sendingReply[msg._id] || !replyInputs[msg._id]?.trim()}
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
