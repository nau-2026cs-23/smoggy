import { useState, useEffect, useCallback } from 'react';
import { ticketsApi, reviewsApi } from '../../lib/api';
import { toast } from 'sonner';
import type { Ticket, Review } from '../../types';
import {
  ClipboardList, Star, CheckCircle2, Clock, Wrench,
  ChevronDown, Loader2, ArrowLeft
} from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: '待处理', color: 'text-amber-700',  bg: 'bg-amber-50' },
  assigned:    { label: '已分配', color: 'text-blue-700',   bg: 'bg-blue-50' },
  in_progress: { label: '处理中', color: 'text-[#2E6DA4]',  bg: 'bg-blue-50' },
  completed:   { label: '已完成', color: 'text-green-700',  bg: 'bg-green-50' },
  cancelled:   { label: '已取消', color: 'text-gray-500',   bg: 'bg-gray-100' },
};

const FAULT_LABELS: Record<string, string> = {
  electric: '电气', plumbing: '水暖', door: '门窗', other: '其他',
};

const StarRating = ({ value }: { value: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <svg key={s} className={`w-4 h-4 ${value >= s ? 'text-[#F59E0B]' : 'text-[#CBD5E1]'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

type WorkerTab = 'tasks' | 'reviews';

const WorkerView = () => {
  const [tab, setTab] = useState<WorkerTab>('tasks');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [workerNote, setWorkerNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [workerStats, setWorkerStats] = useState({ avgRating: 0, totalReviews: 0 });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ticketsApi.getWorkerTickets();
      if (res.success) setTickets(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      // Get user id from token
      const token = localStorage.getItem('token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const workerId = payload.userId;
      const res = await reviewsApi.getByWorker(workerId);
      if (res.success) {
        setReviews(res.data.reviews);
        setWorkerStats(res.data.stats);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (tab === 'reviews') fetchReviews();
  }, [tab, fetchReviews]);

  const handleUpdateStatus = async () => {
    if (!selectedTicket || !newStatus) return;
    setUpdating(true);
    try {
      const res = await ticketsApi.updateStatus(selectedTicket.id, newStatus, workerNote || undefined);
      if (res.success) {
        toast.success('状态已更新');
        setSelectedTicket(null);
        setNewStatus('');
        setWorkerNote('');
        fetchTickets();
      } else {
        toast.error('更新失败', { description: res.message });
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setUpdating(false);
    }
  };

  const pendingCount = tickets.filter(t => t.status === 'assigned' || t.status === 'pending').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const completedCount = tickets.filter(t => t.status === 'completed').length;

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-[system-ui] text-2xl font-bold text-[#1A202C] mb-1">维修工作台</h1>
          <p className="text-[#64748B] text-sm">管理您的维修任务和查看客户评价</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: '待处理', value: pendingCount, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: '处理中', value: inProgressCount, color: 'text-[#2E6DA4]', bg: 'bg-blue-50' },
            { label: '已完成', value: completedCount, color: 'text-green-600', bg: 'bg-green-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-4 text-center">
              <div className={`text-2xl font-bold font-[system-ui] ${s.color} mb-1`}>{s.value}</div>
              <div className="text-sm text-[#64748B]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-[#CBD5E1] p-1 mb-6 w-fit">
          {([
            { key: 'tasks', label: '我的任务', icon: <Wrench className="w-4 h-4" /> },
            { key: 'reviews', label: '我的评价', icon: <Star className="w-4 h-4" /> },
          ] as { key: WorkerTab; label: string; icon: React.ReactNode }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? 'bg-[#1E3A5F] text-white shadow-sm' : 'text-[#64748B] hover:text-[#1A202C]'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tasks Tab */}
        {tab === 'tasks' && (
          <div>
            {selectedTicket ? (
              <div className="max-w-2xl">
                <button
                  onClick={() => { setSelectedTicket(null); setNewStatus(''); setWorkerNote(''); }}
                  className="flex items-center gap-2 text-[#2E6DA4] hover:text-[#1E3A5F] font-medium mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  返回任务列表
                </button>

                <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm p-6 mb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-xs font-mono text-[#64748B] bg-[#F0F4F8] px-2 py-0.5 rounded">{selectedTicket.ticketNo}</span>
                      <h2 className="text-xl font-bold text-[#1A202C] mt-2">
                        {FAULT_LABELS[selectedTicket.faultType]} · {selectedTicket.building}号楼 {selectedTicket.room}室
                      </h2>
                    </div>
                    <span className={`inline-flex items-center gap-1 ${STATUS_MAP[selectedTicket.status]?.bg} ${STATUS_MAP[selectedTicket.status]?.color} text-sm font-semibold px-3 py-1.5 rounded-full`}>
                      {STATUS_MAP[selectedTicket.status]?.label}
                    </span>
                  </div>
                  <p className="text-[#64748B] leading-relaxed mb-4">{selectedTicket.description}</p>
                  {selectedTicket.contact && (
                    <p className="text-sm text-[#64748B]">联系方式：{selectedTicket.contact}</p>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm p-6">
                  <h3 className="font-bold text-[#1A202C] mb-4">更新工单状态</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#1A202C] mb-2">新状态</label>
                      <select
                        value={newStatus}
                        onChange={e => setNewStatus(e.target.value)}
                        className="w-full bg-[#F0F4F8] border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#2E6DA4] focus:border-transparent transition-all"
                      >
                        <option value="">选择新状态</option>
                        <option value="in_progress">处理中</option>
                        <option value="completed">已完成</option>
                        <option value="cancelled">已取消</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#1A202C] mb-2">维修备注</label>
                      <textarea
                        value={workerNote}
                        onChange={e => setWorkerNote(e.target.value)}
                        rows={3}
                        placeholder="请填写维修进展、问题原因或完成情况..."
                        className="w-full bg-[#F0F4F8] border border-[#CBD5E1] rounded-lg px-4 py-3 text-sm text-[#1A202C] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2E6DA4] focus:border-transparent transition-all resize-none"
                      />
                    </div>
                    <button
                      onClick={handleUpdateStatus}
                      disabled={updating || !newStatus}
                      className="w-full flex items-center justify-center gap-2 bg-[#1E3A5F] hover:bg-[#2E6DA4] text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 disabled:opacity-60 min-h-[44px]"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {updating ? '更新中...' : '确认更新'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {loading ? (
                  <div className="text-center py-12 text-[#64748B]">加载中...</div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-[#CBD5E1]">
                    <Wrench className="w-12 h-12 mx-auto mb-3 text-[#CBD5E1]" />
                    <p className="text-[#64748B]">暂无分配的维修任务</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.map(ticket => {
                      const st = STATUS_MAP[ticket.status] || STATUS_MAP.pending;
                      return (
                        <div
                          key={ticket.id}
                          onClick={() => { setSelectedTicket(ticket); setNewStatus(ticket.status); setWorkerNote(ticket.workerNote || ''); }}
                          className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-5 cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <span className="text-xs font-mono text-[#64748B] bg-[#F0F4F8] px-2 py-0.5 rounded">{ticket.ticketNo}</span>
                                <span className={`inline-flex items-center gap-1 ${st.bg} ${st.color} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                                  {st.label}
                                </span>
                                <span className="text-xs bg-[#F0F4F8] text-[#64748B] px-2 py-0.5 rounded">{FAULT_LABELS[ticket.faultType] || ticket.faultType}</span>
                              </div>
                              <h3 className="font-semibold text-[#1A202C] mb-1">{ticket.building}号楼 {ticket.room}室</h3>
                              <p className="text-sm text-[#64748B] line-clamp-2">{ticket.description}</p>
                            </div>
                            <div className="text-xs text-[#64748B] flex-shrink-0">
                              {new Date(ticket.createdAt).toLocaleDateString('zh-CN')}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {tab === 'reviews' && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#F59E0B]">{workerStats.avgRating}</div>
                  <div className="text-xs text-[#64748B]">平均评分</div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1E3A5F]/10 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-[#1E3A5F]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#1E3A5F]">{workerStats.totalReviews}</div>
                  <div className="text-xs text-[#64748B]">收到评价</div>
                </div>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#CBD5E1]">
                <Star className="w-12 h-12 mx-auto mb-3 text-[#CBD5E1]" />
                <p className="text-[#64748B]">暂无评价</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(review => {
                  const tags = review.tags ? JSON.parse(review.tags) as string[] : [];
                  return (
                    <div key={review.id} className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <StarRating value={review.rating} />
                            <span className="text-sm font-semibold text-[#F59E0B]">{review.rating}/5</span>
                          </div>
                          {review.comment && <p className="text-sm text-[#64748B] mb-2">{review.comment}</p>}
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {tags.map((tag: string) => (
                                <span key={tag} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-[#64748B] flex-shrink-0">
                          {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerView;
