import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

interface TicketReply {
  id: number;
  ticket: number;
  sender: number;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
}

interface SupportTicket {
  id: number;
  submitted_by: number;
  submitted_by_name: string;
  issue_type: 'order' | 'payment' | 'product' | 'account' | 'vendor' | 'other';
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  related_order: number | null;
  created_at: string;
  updated_at: string;
  replies?: TicketReply[];
}

const SupportTickets: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>('admin-panel/tickets/');
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setTickets(data);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch tickets:', err);
      setError('Could not connect to backend API. Loading local design simulation data.');
      // Mock Fallback Data
      setTickets([
        {
          id: 1001,
          submitted_by: 5,
          submitted_by_name: 'Anjali Deshmukh',
          issue_type: 'payment',
          subject: 'Double charged during mock payment confirmation',
          description: 'I clicked on the mock payment success button but got an error first. I tried again and it succeeded, but in my order logs I see two duplicate pending orders. Please cancel the extra one.',
          priority: 'urgent',
          status: 'open',
          related_order: 24,
          created_at: '2026-05-21T09:00:00Z',
          updated_at: '2026-05-21T09:00:00Z'
        },
        {
          id: 1002,
          submitted_by: 3,
          submitted_by_name: 'Raja Tailors',
          issue_type: 'vendor',
          subject: 'Cannot upload HD banner image',
          description: 'I tried uploading a 5MB JPEG banner to my boutique profile but keep getting a server 500 error. Is there an image file size limit for vendor profiles?',
          priority: 'medium',
          status: 'in_progress',
          related_order: null,
          created_at: '2026-05-20T11:20:00Z',
          updated_at: '2026-05-20T15:30:00Z'
        },
        {
          id: 1003,
          submitted_by: 6,
          submitted_by_name: 'Vikram Malhotra',
          issue_type: 'order',
          subject: 'Virtual sizing slot not confirmed yet',
          description: 'I requested an appointment slot 3 days ago for my sherwani customization. The artisan has not confirmed the slot yet. Can you please check with them?',
          priority: 'high',
          status: 'open',
          related_order: 22,
          created_at: '2026-05-21T12:00:00Z',
          updated_at: '2026-05-21T12:00:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId: number, newStatus: string) => {
    try {
      const response = await api.patch<SupportTicket>(`admin-panel/tickets/${ticketId}/`, {
        status: newStatus,
      });
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? response.data : t)));
      setSelectedTicket(response.data);
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Could not update ticket status.');
    }
  };

  const handleUpdatePriority = async (ticketId: number, newPriority: string) => {
    try {
      const response = await api.patch<SupportTicket>(`admin-panel/tickets/${ticketId}/`, {
        priority: newPriority,
      });
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? response.data : t)));
      setSelectedTicket(response.data);
    } catch (err) {
      console.error('Failed to update priority:', err);
      alert('Could not update ticket priority.');
    }
  };

  const handleSelectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    try {
      const res = await api.get<any>(`admin-panel/tickets/${ticket.id}/replies/`);
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setReplies(data);
    } catch (err) {
      console.error('Failed to fetch replies:', err);
      setReplies([]);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    setReplyLoading(true);
    try {
      const res = await api.post<TicketReply>(`admin-panel/tickets/${selectedTicket.id}/replies/`, {
        message: replyMessage,
      });
      setReplies((prev) => [...prev, res.data]);
      setReplyMessage('');
    } catch (err) {
      console.error('Failed to post reply:', err);
      alert('Could not send reply. Please try again.');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleCloseTicketDetails = () => {
    setSelectedTicket(null);
    setReplies([]);
    setReplyMessage('');
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="bg-red-100 text-red-800 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-red-200">Urgent</span>;
      case 'high':
        return <span className="bg-orange-100 text-orange-800 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-orange-200">High</span>;
      case 'medium':
        return <span className="bg-blue-100 text-blue-800 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-blue-200">Medium</span>;
      case 'low':
        return <span className="bg-gray-100 text-gray-800 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-gray-200">Low</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="bg-yellow-100 text-yellow-800 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-yellow-200">Open</span>;
      case 'in_progress':
        return <span className="bg-indigo-100 text-indigo-800 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-indigo-200">In Progress</span>;
      case 'resolved':
        return <span className="bg-green-100 text-green-800 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-green-200">Resolved</span>;
      case 'closed':
        return <span className="bg-gray-100 text-gray-800 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-gray-200">Closed</span>;
      default:
        return null;
    }
  };

  const getIssueTypeLabel = (type: string) => {
    switch (type) {
      case 'order': return 'Order Details';
      case 'payment': return 'Billing & Payments';
      case 'product': return 'Product Listings';
      case 'account': return 'User Profile/Auth';
      case 'vendor': return 'Artisan Dispute';
      default: return 'General Support';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="font-headline text-3xl font-bold text-on-surface">Support & Inquiries</h2>
        <p className="font-body text-sm text-on-surface-variant mt-1">
          Monitor tickets submitted by shoppers and boutique owners. Ensure SLA times are maintained.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-tertiary-container/10 border border-outline-variant/30 rounded-lg text-secondary text-xs font-body flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-bold uppercase tracking-wider text-primary">Dismiss</button>
        </div>
      )}

      {/* Filters bar */}
      <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="flex gap-4 items-center flex-wrap">
          <div>
            <label className="font-body text-[10px] uppercase tracking-wider font-bold text-secondary block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="bg-surface border border-outline-variant/30 text-xs px-3 py-1.5 rounded text-on-surface focus:outline-none focus:border-primary font-body"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="font-body text-[10px] uppercase tracking-wider font-bold text-secondary block mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e: any) => setPriorityFilter(e.target.value)}
              className="bg-surface border border-outline-variant/30 text-xs px-3 py-1.5 rounded text-on-surface focus:outline-none focus:border-primary font-body"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="font-body text-xs text-on-surface-variant font-medium">
          Showing {filteredTickets.length} of {tickets.length} tickets
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-secondary text-5xl mb-4">support_agent</span>
          <h3 className="font-headline text-lg font-bold text-on-surface mb-1">No Tickets Found</h3>
          <p className="font-body text-xs text-on-surface-variant">Adjust your filter options or wait for incoming requests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => handleSelectTicket(ticket)}
              className={`bg-surface-container-low border hover:shadow-md cursor-pointer rounded-xl p-5 lg:p-6 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                ticket.priority === 'urgent' && ticket.status === 'open'
                  ? 'border-error/60 bg-error/[0.02]'
                  : 'border-outline-variant/10'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-bold text-primary">#{ticket.id}</span>
                  <h3 className="font-headline text-base font-bold text-on-surface">{ticket.subject}</h3>
                  <span className="bg-primary/5 text-primary-container text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
                    {getIssueTypeLabel(ticket.issue_type)}
                  </span>
                </div>
                
                <p className="font-body text-xs text-secondary line-clamp-1">
                  {ticket.description}
                </p>

                <div className="flex items-center gap-4 text-xs font-body text-on-surface-variant font-medium flex-wrap pt-1">
                  <div>
                    By: <strong className="text-on-surface">{ticket.submitted_by_name}</strong>
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full bg-outline-variant/30"></div>
                  <div>
                    Submitted:{' '}
                    {new Date(ticket.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                  {ticket.related_order && (
                    <>
                      <div className="h-1.5 w-1.5 rounded-full bg-outline-variant/30"></div>
                      <div className="font-mono text-primary font-bold">
                        Order #{ticket.related_order}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Status and Priority Badges */}
              <div className="flex items-center gap-3 sm:shrink-0 self-end sm:self-center">
                {getPriorityBadge(ticket.priority)}
                {getStatusBadge(ticket.status)}
                <span className="material-symbols-outlined text-secondary text-lg hover:text-primary">
                  chevron_right
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Details Drawer / Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-low border border-outline-variant/20 rounded-3xl p-6 lg:p-8 max-w-xl w-full shadow-2xl relative flex flex-col max-h-[90vh]">
            <button
              onClick={handleCloseTicketDetails}
              className="absolute top-4 right-4 text-secondary hover:text-primary p-1 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="space-y-6 overflow-y-auto pr-2 flex-1 scrollbar-thin">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-mono text-sm font-bold text-primary">Ticket #{selectedTicket.id}</span>
                  {getPriorityBadge(selectedTicket.priority)}
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <h3 className="font-headline text-xl font-bold text-on-surface">{selectedTicket.subject}</h3>
                <p className="font-body text-xs text-on-surface-variant mt-1.5">
                  Submitted by <strong className="text-on-surface">{selectedTicket.submitted_by_name}</strong> on{' '}
                  {new Date(selectedTicket.created_at).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div className="bg-surface p-4 border border-outline-variant/10 rounded-xl">
                <p className="font-body text-[10px] uppercase tracking-wider font-bold text-secondary mb-2">Category: {getIssueTypeLabel(selectedTicket.issue_type)}</p>
                <p className="font-body text-sm text-secondary whitespace-pre-line leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {selectedTicket.related_order && (
                <div className="bg-primary/5 border border-primary/20 p-3.5 rounded-xl flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">receipt_long</span>
                    <span className="font-body text-xs text-on-surface-variant font-medium">Related Platform Purchase:</span>
                    <span className="font-mono text-sm font-bold text-primary">Order #{selectedTicket.related_order}</span>
                  </div>
                  <span className="bg-primary/10 text-primary font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded">Simulated COD/Paid</span>
                </div>
              )}

              {/* Conversation History thread */}
              <div className="border-t border-outline-variant/20 pt-4 space-y-4">
                <h4 className="font-headline text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">forum</span>
                  Conversation History
                </h4>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                  {/* Customer description (first message) */}
                  <div className="flex flex-col items-start">
                    <div className="bg-surface-container-low p-3 rounded-2xl rounded-tl-none max-w-[85%] border border-outline-variant/5">
                      <div className="flex justify-between items-center gap-4 mb-1">
                        <span className="font-label text-[9px] font-bold text-primary">
                          {selectedTicket.submitted_by_name} (Author)
                        </span>
                        <span className="font-body text-[8px] text-secondary">
                          {new Date(selectedTicket.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="font-body text-xs text-on-surface whitespace-pre-line">{selectedTicket.description}</p>
                    </div>
                  </div>

                  {/* Replies */}
                  {replies.map((reply) => {
                    const isAdmin = reply.sender_role === 'admin';
                    return (
                      <div key={reply.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <div className={`p-3 rounded-2xl max-w-[85%] border ${
                          isAdmin
                            ? 'bg-primary/10 border-primary/20 rounded-tr-none'
                            : 'bg-surface-container-low border-outline-variant/5 rounded-tl-none'
                        }`}>
                          <div className={`flex justify-between items-center gap-4 mb-1 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                            <span className="font-label text-[9px] font-bold text-primary">
                              {isAdmin ? `${reply.sender_name} (You)` : reply.sender_name}
                            </span>
                            <span className="font-body text-[8px] text-secondary">
                              {new Date(reply.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="font-body text-xs text-on-surface whitespace-pre-line">{reply.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Send reply */}
                {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' ? (
                  <form onSubmit={handlePostReply} className="flex gap-2 pt-2">
                    <input
                      type="text"
                      name="reply_message"
                      placeholder="Type reply to client..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      required
                      className="flex-1 bg-surface border border-outline-variant/30 rounded-xl px-3 py-2 text-xs font-body focus:outline-none focus:border-primary text-on-surface"
                    />
                    <button
                      type="submit"
                      disabled={replyLoading || !replyMessage.trim()}
                      className="px-4 bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 rounded-xl font-label text-[9px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-1 shrink-0 shadow-sm"
                    >
                      {replyLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent"></div>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-xs">send</span>
                          <span>Send</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="bg-surface-container-low text-center p-3 rounded-xl border border-outline-variant/10 text-xs font-body text-secondary italic">
                    This ticket is resolved or closed. Replies are disabled.
                  </div>
                )}
              </div>

              <div className="border-t border-outline-variant/20 pt-4 space-y-4">
                <h4 className="font-headline text-sm font-bold text-on-surface">Concierge Actions</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">Status</label>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                      className="w-full bg-surface border border-outline-variant/30 text-xs px-3 py-2 rounded text-on-surface focus:outline-none focus:border-primary font-body"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">Priority</label>
                    <select
                      value={selectedTicket.priority}
                      onChange={(e) => handleUpdatePriority(selectedTicket.id, e.target.value)}
                      className="w-full bg-surface border border-outline-variant/30 text-xs px-3 py-2 rounded text-on-surface focus:outline-none focus:border-primary font-body"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-outline-variant/20 pt-4 mt-4">
              <button
                onClick={handleCloseTicketDetails}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-label text-xs uppercase tracking-wider font-bold hover:bg-primary-container transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
