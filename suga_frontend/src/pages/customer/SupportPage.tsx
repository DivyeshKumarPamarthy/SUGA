import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

interface OrderItem {
  id: number;
  product_title: string;
  quantity: number;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  total: string;
  created_at: string;
  items: OrderItem[];
}

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

const SupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form inputs
  const [issueType, setIssueType] = useState<'order' | 'payment' | 'product' | 'account' | 'vendor' | 'other'>('order');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [relatedOrder, setRelatedOrder] = useState<string>('');

  // Selected ticket for details modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // Active Tab: 'create' or 'history'
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      // Fetch user's support tickets
      const ticketsRes = await api.get<SupportTicket[]>('admin-panel/tickets/my/');
      // Django returns a paginated list or list. Let's handle both.
      const ticketsData = Array.isArray(ticketsRes.data) 
        ? ticketsRes.data 
        : (ticketsRes.data as any).results || [];
      setTickets(ticketsData);

      // Fetch user's orders to link to tickets
      const ordersRes = await api.get<Order[]>('orders/');
      const ordersData = Array.isArray(ordersRes.data) 
        ? ordersRes.data 
        : (ordersRes.data as any).results || [];
      setOrders(ordersData);
    } catch (err: any) {
      console.error('Failed to fetch support data:', err);
      setError('Could not sync with SUGA services. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload: any = {
        issue_type: issueType,
        subject,
        description,
        priority,
      };

      if (relatedOrder) {
        payload.related_order = parseInt(relatedOrder, 10);
      }

      await api.post<SupportTicket>('admin-panel/tickets/create/', payload);
      setSuccessMsg('Your support inquiry has been logged successfully. Our concierge will review it shortly.');
      
      // Reset form
      setSubject('');
      setDescription('');
      setRelatedOrder('');
      setPriority('medium');
      setIssueType('order');
      
      // Refresh tickets list
      const ticketsRes = await api.get<SupportTicket[]>('admin-panel/tickets/my/');
      const ticketsData = Array.isArray(ticketsRes.data) 
        ? ticketsRes.data 
        : (ticketsRes.data as any).results || [];
      setTickets(ticketsData);
      
      // Switch tab to history
      setTimeout(() => {
        setActiveTab('history');
      }, 1500);
    } catch (err: any) {
      console.error('Failed to submit ticket:', err);
      const errorMsg = err.response?.data?.related_order 
        ? `Order link failed: ${err.response.data.related_order[0]}`
        : 'Failed to log inquiry. Please verify inputs.';
      setError(errorMsg);
    } finally {
      setSubmitLoading(false);
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

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return <span className="bg-red-50 text-red-700 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded border border-red-200/50">Urgent</span>;
      case 'high':
        return <span className="bg-orange-50 text-orange-700 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded border border-orange-200/50">High</span>;
      case 'medium':
        return <span className="bg-amber-50 text-amber-700 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded border border-amber-200/50">Medium</span>;
      case 'low':
        return <span className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded border border-slate-200/50">Low</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'open':
        return <span className="bg-yellow-50 text-yellow-800 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded border border-yellow-200/50">Open</span>;
      case 'in_progress':
        return <span className="bg-indigo-50 text-indigo-700 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded border border-indigo-200/50">In Progress</span>;
      case 'resolved':
        return <span className="bg-emerald-50 text-emerald-800 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded border border-emerald-200/50">Resolved</span>;
      case 'closed':
        return <span className="bg-zinc-100 text-zinc-600 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded border border-zinc-200/50">Closed</span>;
      default:
        return null;
    }
  };

  const getIssueLabel = (type: string) => {
    switch (type) {
      case 'order': return 'Order Issue';
      case 'payment': return 'Payment/Billing';
      case 'product': return 'Product Customization';
      case 'account': return 'Account Management';
      case 'vendor': return 'Artisan Conflict';
      default: return 'General Support';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-headline text-sm text-primary italic">Syncing support archives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/15 pb-6">
          <div>
            <h1 className="font-headline text-3xl font-bold text-primary">SUGA Concierge & Support</h1>
            <p className="font-body text-xs text-secondary mt-1">
              File queries regarding boutique crafts, bespoke adjustments, billing, or launch disputes.
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-xl font-label text-xs uppercase tracking-widest font-bold transition-all ${
                activeTab === 'create'
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'border border-outline text-secondary hover:text-primary hover:bg-surface-variant/20'
              }`}
            >
              Submit Ticket
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl font-label text-xs uppercase tracking-widest font-bold transition-all relative ${
                activeTab === 'history'
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'border border-outline text-secondary hover:text-primary hover:bg-surface-variant/20'
              }`}
            >
              My Inquiries
              {tickets.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-tertiary text-on-tertiary text-[9px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-background">
                  {tickets.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Global Messages */}
        {error && (
          <div className="p-4 bg-error-container text-on-error-container border border-error/20 rounded-xl text-xs font-body flex justify-between items-center animate-shake">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold uppercase tracking-wider text-primary ml-4">Dismiss</button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-green-50 text-green-800 border border-green-200 rounded-xl text-xs font-body flex justify-between items-center animate-fadeIn">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="font-bold uppercase tracking-wider text-green-900 ml-4">Dismiss</button>
          </div>
        )}

        {/* Tab content */}
        {activeTab === 'create' ? (
          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-6">
              <h3 className="font-headline text-lg font-bold text-on-surface">Submit Support Ticket</h3>
              <p className="font-body text-xs text-secondary mt-1">Specify your query details. Our admins will resolve this directly.</p>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    name="issue_type"
                    value={issueType}
                    onChange={(e: any) => setIssueType(e.target.value)}
                    className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-primary text-on-surface"
                  >
                    <option value="order">Order Details & Tracking</option>
                    <option value="payment">Payments & Billings</option>
                    <option value="product">Bespoke Fitting & Catalog</option>
                    <option value="account">Profile & Authentication</option>
                    <option value="vendor">Artisan Boutique Feedback</option>
                    <option value="other">Other Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1.5">
                    Priority *
                  </label>
                  <select
                    name="priority"
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value as any)}
                    className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-primary text-on-surface"
                  >
                    <option value="low">Low (General Feedback)</option>
                    <option value="medium">Medium (Standard Queries)</option>
                    <option value="high">High (Urgent Help)</option>
                    <option value="urgent">Urgent (Payment / Delivery Failure)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1.5">
                  Link Order (Optional)
                </label>
                <select
                  name="related_order"
                  value={relatedOrder}
                  onChange={(e) => setRelatedOrder(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-primary text-on-surface"
                >
                  <option value="">-- No Linked Order --</option>
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>
                      Order {order.order_number} — ₹{order.total} ({new Date(order.created_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] font-body text-secondary mt-1">
                  Connecting an order lets our moderators fetch payment logs or tracking statuses faster.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  placeholder="Summarize the core concern (e.g. Size fitting update, double billing)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-primary placeholder-secondary/35 text-on-surface"
                />
              </div>

              <div>
                <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1.5">
                  Detailed Description *
                </label>
                <textarea
                  name="description"
                  required
                  rows={5}
                  placeholder="Explain your issue in detail. If related to an order, specify sizing mismatches or transaction details."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-primary placeholder-secondary/35 text-on-surface"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full py-3 bg-primary text-on-primary hover:bg-primary-container rounded-xl font-label text-xs uppercase tracking-widest font-bold transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  {submitLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">send</span>
                      <span>Submit Inquiry</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="text-center py-20 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/30 max-w-md mx-auto">
                <span className="material-symbols-outlined text-5xl text-secondary mb-4">chat_bubble_outline</span>
                <h3 className="font-headline text-lg font-bold text-on-surface mb-2">No Active Tickets</h3>
                <p className="font-body text-xs text-secondary mb-6 font-medium">
                  You have not submitted any inquiries. If you face issue with sizing, delivery, or payments, log a query.
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-label text-xs uppercase tracking-widest font-bold hover:bg-primary-container transition-colors shadow-md"
                >
                  File First Ticket
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => handleSelectTicket(ticket)}
                    className="bg-surface-container-lowest border border-outline-variant/10 hover:shadow-md cursor-pointer rounded-2xl p-5 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-primary">#{ticket.id}</span>
                        <h3 className="font-headline text-base font-bold text-on-surface">{ticket.subject}</h3>
                        <span className="bg-primary/5 text-primary text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-primary/10">
                          {getIssueLabel(ticket.issue_type)}
                        </span>
                      </div>
                      
                      <p className="font-body text-xs text-secondary line-clamp-1">
                        {ticket.description}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] font-body text-secondary pt-0.5 flex-wrap">
                        <div>
                          Logged:{' '}
                          <strong className="text-on-surface">
                            {new Date(ticket.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </strong>
                        </div>
                        {ticket.related_order && (
                          <>
                            <div className="h-1.5 w-1.5 rounded-full bg-outline-variant/30"></div>
                            <div>
                              Order Ref: <strong className="text-primary font-mono">#{ticket.related_order}</strong>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 sm:shrink-0 self-end md:self-center">
                      {getPriorityBadge(ticket.priority)}
                      {getStatusBadge(ticket.status)}
                      <span className="material-symbols-outlined text-secondary text-lg">chevron_right</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Ticket Drawer / Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-bright border border-outline-variant/20 rounded-3xl p-6 lg:p-8 max-w-xl w-full shadow-2xl relative animate-scaleIn flex flex-col max-h-[90vh]">
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
                  <p className="font-body text-xs text-secondary mt-1">
                    Logged on{' '}
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
                  <p className="font-body text-[10px] uppercase tracking-wider font-bold text-secondary mb-2">
                    Category: {getIssueLabel(selectedTicket.issue_type)}
                  </p>
                  <p className="font-body text-xs sm:text-sm text-secondary whitespace-pre-line leading-relaxed">
                    {selectedTicket.description}
                  </p>
                </div>

                {selectedTicket.related_order && (
                  <div className="bg-primary/5 border border-primary/20 p-3.5 rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">receipt_long</span>
                      <div className="font-body text-xs text-secondary font-medium">
                        Linked Order:{' '}
                        <span className="font-mono text-sm font-bold text-primary">#{selectedTicket.related_order}</span>
                      </div>
                    </div>
                    <Link
                      to="/orders"
                      className="text-[10px] font-label font-bold text-primary uppercase tracking-widest hover:underline"
                    >
                      View Order
                    </Link>
                  </div>
                )}

                {/* Conversation History thread */}
                <div className="mt-6 border-t border-outline-variant/10 pt-6 space-y-4">
                  <h4 className="font-headline text-sm font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">forum</span>
                    Conversation History
                  </h4>

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                    {/* Customer description (first message) */}
                    <div className="flex flex-col items-start">
                      <div className="bg-surface-container-low p-3 rounded-2xl rounded-tl-none max-w-[85%] border border-outline-variant/5">
                        <div className="flex justify-between items-center gap-4 mb-1">
                          <span className="font-label text-[9px] font-bold text-primary">You (Author)</span>
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
                                {isAdmin ? `${reply.sender_name} (Concierge)` : 'You'}
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
                        placeholder="Type your reply..."
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
                            <span>Reply</span>
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

                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 space-y-2 text-xs font-body">
                  <h4 className="font-bold text-on-surface">Concierge Resolution Flow</h4>
                  <p className="text-secondary leading-normal">
                    {selectedTicket.status === 'open' && 'This ticket is registered in our dashboard and is awaiting assignment to a support manager.'}
                    {selectedTicket.status === 'in_progress' && 'A platform moderator is actively working on this issue and contacting relevant artisans/payment processors.'}
                    {selectedTicket.status === 'resolved' && 'Our team has marked this issue as resolved. Please review the details.'}
                    {selectedTicket.status === 'closed' && 'This support query has been concluded.'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-outline-variant/10 pt-4 mt-4">
                <button
                  onClick={handleCloseTicketDetails}
                  className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-label text-xs uppercase tracking-widest font-bold hover:bg-primary-container transition-all"
                >
                  Close Dialog
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SupportPage;
