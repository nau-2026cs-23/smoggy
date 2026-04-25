import { useState, useEffect, useCallback } from 'react';
import { ticketsApi, workersApi, reviewsApi } from '../../lib/api';
import { toast } from 'sonner';
import type { Ticket, Review, User } from '../../types';
import {
  ClipboardList, Users, Star, BarChart3, CheckCircle2,
  Clock, Wrench, AlertCircle, ChevronDown, X, Loader2, RefreshCw
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

type AdminTab = 'tickets' | 'workers' | 'reviews' | 'stats';

const AdminView = () => {
  const [tab, setTab] = useState<AdminTab>('tickets');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, inProgress: 0, completionRate: 0, avgRating: 0 });

  const fetchTickets = useCallback(async () => {
    try {
      const res = await ticketsApi.getAll();
      if (res.success) {
        setTickets(res.data);
        setDataError(null);
      } else {
        setDataError('获取工单失败: ' + res.message);
      }
    } catch (err) {
      setDataError('网络错误，无法获取工单数据');
      console.error('Fetch tickets error:', err);
    }
  }, []);

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await workersApi.getAll();
      if (res.success) {
        setWorkers(res.data);
      } else {
        toast.error('获取维修人员列表失败');
      }
    } catch (err) {
      toast.error('网络错误，无法获取维修人员');
      console.error('Fetch workers error:', err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await ticketsApi.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await reviewsApi.getAll();
      if (res.success) {
        setReviews(res.data);
      }
    } catch (err) {
      console.error('Fetch reviews error:', err);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setDataError(null);
    await Promise.all([fetchTickets(), fetchWorkers(), fetchStats()]);
    setLoading(false);
  }, [fetchTickets, fetchWorkers, fetchStats]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (tab === 'reviews') {
      fetchReviews();
    }
  }, [tab, fetchReviews]);

  const handleAssign = async (ticketId: string) => {
    const workerId = selectedWorker[ticketId];
    if (!workerId) {
      toast.error('请先选择维修人员');
      return;
    }
    setAssigningId(ticketId);
    try {
      const res = await ticketsApi.assignWorker(ticketId, workerId);
      if (res.success) {
        toast.success('工单分配成功！');
        setSelectedWorker(prev => ({ ...prev, [ticketId]: '' }));
        await fetchTickets();
        await fetchStats();
      } else {
        toast.error('分配失败', { description: res.message });
      }
    } catch (err) {
      toast.error('网络错误');
      console.error('Assign error:', err);
    } finally {
      setAssigningId(null);
    }
  };

  const pendingTickets = tickets.filter(t => t.status === 'pending');
  const assignedTickets = tickets.filter(t => t.status === 'assigned');
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress');
  const completedTickets = tickets.filter(t => t.status === 'completed');

  const filteredTickets = filterStatus === 'all'
    ? tickets
    : filterStatus === 'pending'
    ? pendingTickets
    : filterStatus === 'assigned'
    ? assignedTickets
    : filterStatus === 'in_progress'
    ? inProgressTickets
    : completedTickets;

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-[system-ui] text-2xl font-bold text-[#1A202C] mb-1">管理后台</h1>
            <p className="text-[#64748B] text-sm">管理所有报修工单、分配维修人员、查看统计数据</p>
          </div>
          <button
            onClick={fetchAllData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#64748B] hover:text-[#1A202C] hover:border-[#1E3A5F] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新数据
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#1E3A5F]/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-[#1E3A5F]" />
              </div>
            </div>
            <div className="text-2xl font-bold font-[system-ui] text-[#1E3A5F] mb-1">{stats.total}</div>
            <div className="text-sm text-[#64748B]">总工单数</div>
          </div>
          <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="text-2xl font-bold font-[system-ui] text-amber-600 mb-1">{pendingTickets.length}</div>
            <div className="text-sm text-[#64748B]">待分配工单</div>
          </div>
          <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-[#2E6DA4]" />
              </div>
            </div>
            <div className="text-2xl font-bold font-[system-ui] text-[#2E6DA4] mb-1">{assignedTickets.length + inProgressTickets.length}</div>
            <div className="text-sm text-[#64748B]">处理中工单</div>
          </div>
          <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold font-[system-ui] text-green-600 mb-1">{completedTickets.length}</div>
            <div className="text-sm text-[#64748B]">已完成工单</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-[#CBD5E1] p-1 mb-6">
          {([
            { key: 'tickets', label: '工单管理', icon: <ClipboardList className="w-4 h-4" /> },
            { key: 'workers', label: '维修人员', icon: <Users className="w-4 h-4" /> },
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
              {t.label}
            </button>
          ))}
        </div>

        {/* Tickets Tab */}
        {tab === 'tickets' && (
          <div>
            {/* Error Message */}
            {dataError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-600">{dataError}</p>
                </div>
                <button
                  onClick={fetchAllData}
                  className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium rounded-lg transition-colors"
                >
                  重试
                </button>
              </div>
            )}

            {/* Worker Alert */}
            {workers.length === 0 && !loading && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-amber-700">
                    当前没有维修人员账户，无法分配工单。请先创建维修人员账户。
                  </p>
                </div>
              </div>
            )}

            {/* Filter */}
            <div className="flex flex-wrap gap-2 mb-5">
              {[
                ['all', '全部', stats.total],
                ['pending', '待分配', pendingTickets.length],
                ['assigned', '已分配', assignedTickets.length],
                ['in_progress', '处理中', inProgressTickets.length],
                ['completed', '已完成', completedTickets.length]
              ].map(([val, label, count]) => (
                <button
                  key={val}
                  onClick={() => setFilterStatus(val as string)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-2 ${
                    filterStatus === val ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#64748B] border border-[#CBD5E1] hover:border-[#1E3A5F]'
                  }`}
                >
                  {label}
                  <span className={`text-xs ${filterStatus === val ? 'opacity-75' : ''}`}>({count})</span>
                </button>
              ))}
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#CBD5E1]">
                <Loader2 className="w-12 h-12 mx-auto mb-3 text-[#CBD5E1] animate-spin" />
                <p className="text-[#64748B]">加载工单数据中...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#CBD5E1]">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-[#CBD5E1]" />
                <p className="text-[#64748B]">暂无工单</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map(ticket => {
                  const st = STATUS_MAP[ticket.status] || STATUS_MAP.pending;
                  const canAssign = ticket.status === 'pending' && workers.length > 0;
                  return (
                    <div key={ticket.id} className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-5">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        {/* Ticket Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="text-xs font-mono text-[#64748B] bg-[#F0F4F8] px-2 py-0.5 rounded">{ticket.ticketNo}</span>
                            <span className={`inline-flex items-center gap-1 ${st.bg} ${st.color} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                              {st.label}
                            </span>
                            <span className="text-xs bg-[#F0F4F8] text-[#64748B] px-2 py-0.5 rounded">{FAULT_LABELS[ticket.faultType] || ticket.faultType}</span>
                          </div>
                          <h3 className="font-semibold text-[#1A202C] mb-1">{ticket.building}号楼 {ticket.room}室</h3>
                          <p className="text-sm text-[#64748B] line-clamp-2 mb-3">{ticket.description}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-[#64748B]">
                            <span>报修学生：{ticket.student?.name || '未知'}</span>
                            {ticket.worker && (
                              <span className="text-[#2E6DA4]">维修员：{ticket.worker.name}</span>
                            )}
                            <span>提交时间：{new Date(ticket.createdAt).toLocaleDateString('zh-CN')}</span>
                          </div>
                        </div>

                        {/* Assign Worker Section */}
                        <div className="flex-shrink-0 lg:w-80">
                          {canAssign ? (
                            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                              <p className="text-xs text-amber-700 font-medium mb-3 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                待分配 - 请选择维修人员
                              </p>
                              <div className="flex gap-2">
                                <select
                                  value={selectedWorker[ticket.id] || ''}
                                  onChange={e => setSelectedWorker(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                                  className="flex-1 bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#2E6DA4]"
                                >
                                  <option value="">选择维修员</option>
                                  {workers.map(w => (
                                    <option key={w.id} value={w.id}>{w.name || w.email}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleAssign(ticket.id)}
                                  disabled={assigningId === ticket.id || !selectedWorker[ticket.id]}
                                  className="flex items-center gap-1.5 bg-[#1E3A5F] hover:bg-[#2E6DA4] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 min-h-[36px]"
                                >
                                  {assigningId === ticket.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Wrench className="w-3.5 h-3.5" />
                                  )}
                                  分配
                                </button>
                              </div>
                            </div>
                          ) : ticket.status === 'pending' && workers.length === 0 ? (
                            <div className="bg-gray-100 rounded-lg p-4 text-center">
                              <p className="text-xs text-gray-500">暂无维修人员</p>
                            </div>
                          ) : (
                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                              <p className="text-xs text-blue-600">
                                {ticket.worker ? `已分配给 ${ticket.worker.name}` : STATUS_MAP[ticket.status]?.label}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Workers Tab */}
        {tab === 'workers' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1A202C]">维修人员列表</h2>
              <span className="text-sm text-[#64748B]">共 {workers.length} 名维修人员</span>
            </div>

            {workers.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#CBD5E1]">
                <Users className="w-12 h-12 mx-auto mb-3 text-[#CBD5E1]" />
                <p className="text-[#64748B] mb-2">暂无维修人员</p>
                <p className="text-xs text-[#64748B]">请在注册页面创建维修人员账户</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {workers.map(worker => (
                  <div key={worker.id} className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-[#2E6DA4] flex items-center justify-center">
                        <span className="text-white text-lg font-bold">{worker.name?.charAt(0) || '维'}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-[#1A202C]">{worker.name || '未知'}</div>
                        <div className="text-xs text-[#64748B]">{worker.email}</div>
                      </div>
                    </div>
                    {worker.phone && (
                      <div className="text-sm text-[#64748B]">电话：{worker.phone}</div>
                    )}
                    <div className="mt-3 pt-3 border-t border-[#CBD5E1]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-xs text-green-600">在线</span>
                      </div>
                    </div>
                  </div>
                ))}
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
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: '总工单数', value: stats.total, desc: '累计所有报修申请', color: 'text-[#1E3A5F]', bg: 'bg-[#1E3A5F]/5' },
                { label: '已完成', value: stats.completed, desc: '已完成维修的工单', color: 'text-green-600', bg: 'bg-green-50' },
                { label: '待处理', value: pendingTickets.length, desc: '等待分配维修人员', color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: '处理中', value: assignedTickets.length + inProgressTickets.length, desc: '正在进行维修的工单', color: 'text-[#2E6DA4]', bg: 'bg-blue-50' },
                { label: '完成率', value: `${stats.completionRate}%`, desc: '已完成工单占总工单比例', color: 'text-green-600', bg: 'bg-green-50' },
                { label: '平均评分', value: `${stats.avgRating}/5`, desc: '用户满意度评分', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
              ].map((item, i) => (
                <div key={i} className={`${item.bg} rounded-2xl border border-[#CBD5E1] p-6`}>
                  <div className={`text-3xl font-bold font-[system-ui] ${item.color} mb-2`}>{item.value}</div>
                  <div className="font-semibold text-[#1A202C] mb-1">{item.label}</div>
                  <div className="text-sm text-[#64748B]">{item.desc}</div>
                </div>
              ))}
            </div>

            {/* Workers Summary */}
            <div className="bg-white rounded-2xl border border-[#CBD5E1] p-6">
              <h3 className="text-lg font-semibold text-[#1A202C] mb-4">维修人员统计</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-[#1E3A5F]">{workers.length}</div>
                  <div className="text-sm text-[#64748B]">维修人员总数</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">
                    {tickets.filter(t => t.status === 'completed').length}
                  </div>
                  <div className="text-sm text-[#64748B]">已完成工单</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-amber-600">
                    {tickets.filter(t => t.status === 'pending').length}
                  </div>
                  <div className="text-sm text-[#64748B]">待分配工单</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;