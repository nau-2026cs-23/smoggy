import { useState, useEffect, useCallback } from 'react';
import { ticketsApi, workersApi, reviewsApi } from '../../lib/api';
import { toast } from 'sonner';
import type { Ticket, Review, User } from '../../types';
import {
  ClipboardList, Users, Star, BarChart3, CheckCircle2,
  Clock, Wrench, AlertCircle, ChevronDown, X, Loader2
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

const StarRating = ({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) => {
  const sz = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className={`${sz} ${value >= s ? 'text-[#F59E0B]' : 'text-[#CBD5E1]'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

type AdminTab = 'tickets' | 'reviews' | 'stats';

const AdminView = () => {
  const [tab, setTab] = useState<AdminTab>('tickets');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, inProgress: 0, completionRate: 0, avgRating: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ticketsRes, workersRes, statsRes] = await Promise.all([
        ticketsApi.getAll(),
        workersApi.getAll(),
        ticketsApi.getStats(),
      ]);
      if (ticketsRes.success) setTickets(ticketsRes.data);
      if (workersRes.success) setWorkers(workersRes.data);
      if (statsRes.success) setStats(statsRes.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await reviewsApi.getAll();
      if (res.success) setReviews(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (tab === 'reviews') fetchReviews();
  }, [tab, fetchReviews]);

  const handleAssign = async (ticketId: string) => {
    const workerId = selectedWorker[ticketId];
    if (!workerId) { toast.error('请选择维修人员'); return; }
    setAssigningId(ticketId);
    try {
      const res = await ticketsApi.assignWorker(ticketId, workerId);
      if (res.success) {
        toast.success('分配成功');
        fetchData();
      } else {
        toast.error('分配失败', { description: res.message });
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setAssigningId(null);
    }
  };

  const filteredTickets = filterStatus === 'all' ? tickets : tickets.filter(t => t.status === filterStatus);

  const statCards = [
    { label: '总工单数', value: stats.total, icon: <ClipboardList className="w-5 h-5" />, color: 'text-[#1E3A5F]', bg: 'bg-[#1E3A5F]/10' },
    { label: '待处理', value: stats.pending, icon: <Clock className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: '处理中', value: stats.inProgress, icon: <Wrench className="w-5 h-5" />, color: 'text-[#2E6DA4]', bg: 'bg-blue-50' },
    { label: '已完成', value: stats.completed, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-[system-ui] text-2xl font-bold text-[#1A202C] mb-1">管理后台</h1>
          <p className="text-[#64748B] text-sm">管理所有报修工单、分配维修人员、查看评价数据</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <span className={card.color}>{card.icon}</span>
                </div>
              </div>
              <div className={`text-2xl font-bold font-[system-ui] ${card.color} mb-1`}>{card.value}</div>
              <div className="text-sm text-[#64748B]">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-[#CBD5E1] p-1 mb-6 w-fit">
          {([
            { key: 'tickets', label: '工单管理', icon: <ClipboardList className="w-4 h-4" /> },
            { key: 'reviews', label: '评价管理', icon: <Star className="w-4 h-4" /> },
            { key: 'stats', label: '统计报表', icon: <BarChart3 className="w-4 h-4" /> },
          ] as { key: AdminTab; label: string; icon: React.ReactNode }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? 'bg-[#1E3A5F] text-white shadow-sm' : 'text-[#64748B] hover:text-[#1A202C]'
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tickets Tab */}
        {tab === 'tickets' && (
          <div>
            {/* Filter */}
            <div className="flex flex-wrap gap-2 mb-5">
              {[['all', '全部'], ['pending', '待处理'], ['assigned', '已分配'], ['in_progress', '处理中'], ['completed', '已完成']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilterStatus(val)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filterStatus === val ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#64748B] border border-[#CBD5E1] hover:border-[#1E3A5F]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12 text-[#64748B]">加载中...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#CBD5E1]">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-[#CBD5E1]" />
                <p className="text-[#64748B]">暂无工单</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map(ticket => {
                  const st = STATUS_MAP[ticket.status] || STATUS_MAP.pending;
                  return (
                    <div key={ticket.id} className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="text-xs font-mono text-[#64748B] bg-[#F0F4F8] px-2 py-0.5 rounded">{ticket.ticketNo}</span>
                            <span className={`inline-flex items-center gap-1 ${st.bg} ${st.color} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                              {st.label}
                            </span>
                            <span className="text-xs bg-[#F0F4F8] text-[#64748B] px-2 py-0.5 rounded">{FAULT_LABELS[ticket.faultType] || ticket.faultType}</span>
                          </div>
                          <h3 className="font-semibold text-[#1A202C] mb-1">{ticket.building}号楼 {ticket.room}室</h3>
                          <p className="text-sm text-[#64748B] line-clamp-2 mb-2">{ticket.description}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-[#64748B]">
                            <span>学生：{ticket.student?.name || '未知'}</span>
                            {ticket.worker && <span>维修员：{ticket.worker.name}</span>}
                            <span>提交：{new Date(ticket.createdAt).toLocaleDateString('zh-CN')}</span>
                          </div>
                        </div>

                        {/* Assign Worker */}
                        {(ticket.status === 'pending') && workers.length > 0 && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <select
                              value={selectedWorker[ticket.id] || ''}
                              onChange={e => setSelectedWorker(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                              className="bg-[#F0F4F8] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#2E6DA4] min-w-[120px]"
                            >
                              <option value="">选择维修员</option>
                              {workers.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAssign(ticket.id)}
                              disabled={assigningId === ticket.id || !selectedWorker[ticket.id]}
                              className="flex items-center gap-1.5 bg-[#1E3A5F] hover:bg-[#2E6DA4] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 min-h-[36px]"
                            >
                              {assigningId === ticket.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                              分配
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                  <div className="text-2xl font-bold text-[#F59E0B]">{stats.avgRating || 0}</div>
                  <div className="text-xs text-[#64748B]">平均评分</div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1E3A5F]/10 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-[#1E3A5F]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#1E3A5F]">{reviews.length}</div>
                  <div className="text-xs text-[#64748B]">总评价数</div>
                </div>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#CBD5E1]">
                <Star className="w-12 h-12 mx-auto mb-3 text-[#CBD5E1]" />
                <p className="text-[#64748B]">暂无评价数据</p>
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
                            <div className="w-8 h-8 rounded-full bg-[#2E6DA4] flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{(review.student?.name || '匿')[0]}</span>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-[#1A202C]">{review.student?.name || '匿名用户'}</div>
                              {review.ticket && <div className="text-xs text-[#64748B]">{review.ticket.building}号楼 {review.ticket.room}室</div>}
                            </div>
                            <StarRating value={review.rating} />
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

        {/* Stats Tab */}
        {tab === 'stats' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: '总工单数', value: stats.total, desc: '累计所有报修申请', color: 'text-[#1E3A5F]', bg: 'bg-[#1E3A5F]/5' },
              { label: '已完成', value: stats.completed, desc: '已完成维修的工单', color: 'text-green-600', bg: 'bg-green-50' },
              { label: '待处理', value: stats.pending, desc: '等待分配维修人员', color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: '处理中', value: stats.inProgress, desc: '正在进行维修的工单', color: 'text-[#2E6DA4]', bg: 'bg-blue-50' },
              { label: '完成率', value: `${stats.completionRate}%`, desc: '按时完成维修的比例', color: 'text-green-600', bg: 'bg-green-50' },
              { label: '平均评分', value: `${stats.avgRating}/5`, desc: '用户满意度评分', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
            ].map((item, i) => (
              <div key={i} className={`${item.bg} rounded-2xl border border-[#CBD5E1] p-6`}>
                <div className={`text-3xl font-bold font-[system-ui] ${item.color} mb-2`}>{item.value}</div>
                <div className="font-semibold text-[#1A202C] mb-1">{item.label}</div>
                <div className="text-sm text-[#64748B]">{item.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
