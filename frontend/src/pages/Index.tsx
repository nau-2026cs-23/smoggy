import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ticketsApi, reviewsApi } from '../lib/api';
import { toast } from 'sonner';
import type { Ticket, Review, AppView } from '../types';
import OmniflowBadge from '@/components/custom/OmniflowBadge';
import AdminView from '../components/custom/AdminView';
import WorkerView from '../components/custom/WorkerView';
import {
  Building2, Plus, ClipboardList, Star, LogOut, Menu, X,
  CheckCircle2, Clock, Wrench, AlertCircle, ChevronRight,
  Send, RotateCcw, User, Phone, FileText, Image as ImageIcon,
  Zap, Droplets, Lock, MoreHorizontal, ArrowLeft
} from 'lucide-react';

// ============================================
// Helpers
// ============================================
const STATUS_MAP: Record<string, { label: string; color: string; bg: string; dot?: string }> = {
  pending:     { label: '待处理',  color: 'text-amber-700',  bg: 'bg-amber-50',  dot: 'bg-amber-500' },
  assigned:    { label: '已分配',  color: 'text-blue-700',   bg: 'bg-blue-50',   dot: 'bg-blue-500' },
  in_progress: { label: '处理中',  color: 'text-[#2E6DA4]',  bg: 'bg-blue-50',   dot: 'bg-[#2E6DA4]' },
  completed:   { label: '已完成',  color: 'text-green-700',  bg: 'bg-green-50' },
  cancelled:   { label: '已取消',  color: 'text-gray-500',   bg: 'bg-gray-100' },
};

const FAULT_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  electric: { label: '电气',  icon: <Zap className="w-5 h-5" /> },
  plumbing: { label: '水暖',  icon: <Droplets className="w-5 h-5" /> },
  door:     { label: '门窗',  icon: <Lock className="w-5 h-5" /> },
  other:    { label: '其他',  icon: <MoreHorizontal className="w-5 h-5" /> },
};

const statusBarColor = (status: string) => {
  if (status === 'completed') return 'bg-green-500';
  if (status === 'in_progress' || status === 'assigned') return 'bg-[#2E6DA4]';
  if (status === 'cancelled') return 'bg-gray-400';
  return 'bg-amber-500';
};

const StarRating = ({ value, onChange, size = 'md' }: { value: number; onChange?: (v: number) => void; size?: 'sm' | 'md' | 'lg' }) => {
  const [hover, setHover] = useState(0);
  const sz = size === 'lg' ? 'w-9 h-9' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
          className={`${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
        >
          <svg className={`${sz} ${(hover || value) >= star ? 'text-[#F59E0B]' : 'text-[#CBD5E1]'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

const ratingLabel = (r: number) => ['', '非常不满意', '不满意', '一般', '满意', '非常满意'][r] || '';

// ============================================
// Ticket Card
// ============================================
const TicketCard = ({ ticket, onSelect }: { ticket: Ticket; onSelect: (t: Ticket) => void }) => {
  const st = STATUS_MAP[ticket.status] || STATUS_MAP.pending;
  const ft = FAULT_MAP[ticket.faultType];
  const progress = ticket.status === 'completed' ? 100 : ticket.status === 'in_progress' ? 66 : ticket.status === 'assigned' ? 33 : 8;
  const progressColor = ticket.status === 'completed' ? 'bg-green-500' : ticket.status === 'in_progress' || ticket.status === 'assigned' ? 'bg-[#2E6DA4]' : 'bg-amber-500';

  return (
    <div
      onClick={() => onSelect(ticket)}
      className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden cursor-pointer"
    >
      <div className={`h-1.5 ${statusBarColor(ticket.status)}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-mono text-[#64748B] bg-[#F0F4F8] px-2 py-0.5 rounded">{ticket.ticketNo}</span>
            <h3 className="font-semibold text-[#1A202C] mt-2 truncate">
              {ft?.label || ticket.faultType} · {ticket.building}楼 {ticket.room}室
            </h3>
          </div>
          <span className={`ml-2 flex-shrink-0 inline-flex items-center gap-1.5 ${st.bg} ${st.color} text-xs font-semibold px-2.5 py-1 rounded-full`}>
            {st.dot && <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${ticket.status === 'in_progress' ? 'animate-pulse' : ''}`} />}
            {ticket.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
            {st.label}
          </span>
        </div>
        <p className="text-sm text-[#64748B] mb-4 leading-relaxed line-clamp-2">{ticket.description}</p>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 bg-[#F0F4F8] rounded-full h-1.5">
            <div className={`${progressColor} h-1.5 rounded-full transition-all`} style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-[#64748B]">{ticket.status === 'completed' ? '100%' : ticket.status === 'pending' ? '待分配' : `${progress}%`}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-[#64748B]">
          <div className="flex items-center gap-1">
            {ticket.worker ? (
              <><User className="w-3.5 h-3.5" /><span>{ticket.worker.name}</span></>
            ) : (
              <><Clock className="w-3.5 h-3.5" /><span>等待分配维修人员</span></>
            )}
          </div>
          <span>{new Date(ticket.createdAt).toLocaleDateString('zh-CN')}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Ticket Detail
// ============================================
const TicketDetail = ({ ticket, onBack, onReviewSubmitted }: { ticket: Ticket; onBack: () => void; onReviewSubmitted: () => void }) => {
  const [review, setReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingReview, setLoadingReview] = useState(true);

  const TAGS = ['响应及时', '技术专业', '态度友好', '清洁整齐'];

  useEffect(() => {
    const fetchReview = async () => {
      if (ticket.status === 'completed') {
        try {
          const res = await reviewsApi.getByTicket(ticket.id);
          if (res.success) setReview(res.data);
        } catch { /* ignore */ }
      }
      setLoadingReview(false);
    };
    fetchReview();
  }, [ticket.id, ticket.status]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await reviewsApi.create({
        ticketId: ticket.id,
        rating,
        comment: comment || undefined,
        tags: selectedTags.length > 0 ? JSON.stringify(selectedTags) : undefined,
      });
      if (res.success) {
        setReview(res.data);
        toast.success('评价提交成功', { description: '感谢您的反馈！' });
        onReviewSubmitted();
      } else {
        toast.error('提交失败', { description: res.message });
      }
    } catch {
      toast.error('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { label: '报修申请已提交', desc: '您的报修申请已成功提交，系统已发送确认通知。', done: true, time: ticket.createdAt },
    { label: '工单已分配', desc: ticket.worker ? `管理员已将工单分配给维修人员 ${ticket.worker.name}。` : '等待管理员分配维修人员。', done: !!ticket.workerId, time: ticket.workerId ? ticket.updatedAt : null },
    { label: '维修进行中', desc: ticket.workerNote || '维修人员正在处理中。', done: ticket.status === 'completed', active: ticket.status === 'in_progress' || ticket.status === 'assigned', time: ticket.status !== 'pending' ? ticket.updatedAt : null },
    { label: '维修完成 · 等待评价', desc: '维修完成后，请对本次服务进行评价。', done: ticket.status === 'completed', time: ticket.completedAt },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-[#2E6DA4] hover:text-[#1E3A5F] font-medium mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        返回工单列表
      </button>

      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden mb-6">
        <div className={`h-2 ${statusBarColor(ticket.status)}`} />
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-xs font-mono text-[#64748B] bg-[#F0F4F8] px-2 py-0.5 rounded">{ticket.ticketNo}</span>
              <h2 className="text-xl font-bold text-[#1A202C] mt-2">
                {FAULT_MAP[ticket.faultType]?.label} · {ticket.building}楼 {ticket.room}室
              </h2>
            </div>
            <span className={`inline-flex items-center gap-1.5 ${STATUS_MAP[ticket.status]?.bg} ${STATUS_MAP[ticket.status]?.color} text-sm font-semibold px-3 py-1.5 rounded-full`}>
              {STATUS_MAP[ticket.status]?.label}
            </span>
          </div>
          <p className="text-[#64748B] leading-relaxed mb-4">{ticket.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div><span className="text-[#64748B]">楼栋：</span><span className="font-medium text-[#1A202C]">{ticket.building}号楼</span></div>
            <div><span className="text-[#64748B]">宿舍：</span><span className="font-medium text-[#1A202C]">{ticket.room}室</span></div>
            <div><span className="text-[#64748B]">类型：</span><span className="font-medium text-[#1A202C]">{FAULT_MAP[ticket.faultType]?.label}</span></div>
            {ticket.contact && <div><span className="text-[#64748B]">联系：</span><span className="font-medium text-[#1A202C]">{ticket.contact}</span></div>}
            {ticket.worker && <div><span className="text-[#64748B]">维修员：</span><span className="font-medium text-[#1A202C]">{ticket.worker.name}</span></div>}
            <div><span className="text-[#64748B]">提交：</span><span className="font-medium text-[#1A202C]">{new Date(ticket.createdAt).toLocaleDateString('zh-CN')}</span></div>
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm p-6 mb-6">
        <h3 className="font-bold text-[#1A202C] mb-6">维修进度追踪</h3>
        <div className="relative">
          <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-[#CBD5E1]" />
          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={i} className={`flex items-start gap-4 relative ${!step.done && !step.active ? 'opacity-40' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                  step.done ? 'bg-green-500' : step.active ? 'bg-[#2E6DA4] shadow-lg' : 'bg-[#CBD5E1]'
                }`}>
                  {step.done ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : step.active ? (
                    <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                  ) : (
                    <span className="text-white text-xs font-bold">{i + 1}</span>
                  )}
                </div>
                <div className="flex-1 pt-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className={`font-semibold ${step.active ? 'text-[#2E6DA4]' : 'text-[#1A202C]'}`}>{step.label}</h4>
                    {step.time && <span className="text-xs text-[#64748B]">{new Date(step.time).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                  <p className="text-sm text-[#64748B] mt-1">{step.desc}</p>
                  {step.active && ticket.workerNote && (
                    <div className="mt-3 bg-[#F0F4F8] rounded-lg p-3 border border-[#CBD5E1]">
                      <p className="text-xs text-[#64748B]"><strong className="text-[#1A202C]">维修备注：</strong>{ticket.workerNote}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review Section */}
      {ticket.status === 'completed' && !loadingReview && (
        <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm p-6">
          {review ? (
            <div>
              <h3 className="font-bold text-[#1A202C] mb-4">您的评价</h3>
              <div className="flex items-center gap-3 mb-3">
                <StarRating value={review.rating} size="md" />
                <span className="text-sm font-semibold text-[#F59E0B]">{ratingLabel(review.rating)}</span>
              </div>
              {review.comment && <p className="text-sm text-[#64748B] mb-3">{review.comment}</p>}
              {review.tags && (
                <div className="flex flex-wrap gap-2">
                  {(JSON.parse(review.tags) as string[]).map(tag => (
                    <span key={tag} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="font-bold text-[#1A202C] mb-2">评价本次维修服务</h3>
              <p className="text-sm text-[#64748B] mb-5">您的反馈帮助我们持续提升服务质量</p>
              <form onSubmit={handleReviewSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#1A202C] mb-3">整体评分</label>
                  <div className="flex items-center gap-3">
                    <StarRating value={rating} onChange={setRating} size="lg" />
                    <span className="text-sm font-semibold text-[#F59E0B]">{ratingLabel(rating)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A202C] mb-2">文字评价</label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={3}
                    placeholder="请分享您对本次维修服务的感受..."
                    className="w-full bg-[#F0F4F8] border border-[#CBD5E1] rounded-lg px-4 py-3 text-sm text-[#1A202C] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2E6DA4] focus:border-transparent transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A202C] mb-2">快速标签</label>
                  <div className="flex flex-wrap gap-2">
                    {TAGS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-green-50 text-green-700 border-green-300'
                            : 'bg-[#F0F4F8] text-[#64748B] border-[#CBD5E1] hover:border-[#2E6DA4]'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-md disabled:opacity-60 min-h-[44px]"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? '提交中...' : '提交评价'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// Submit Form
// ============================================
const SubmitForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [faultType, setFaultType] = useState<'electric' | 'plumbing' | 'door' | 'other'>('electric');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const faultTypes = [
    { value: 'electric', label: '电气', icon: <Zap className="w-6 h-6" /> },
    { value: 'plumbing', label: '水暖', icon: <Droplets className="w-6 h-6" /> },
    { value: 'door', label: '门窗', icon: <Lock className="w-6 h-6" /> },
    { value: 'other', label: '其他', icon: <MoreHorizontal className="w-6 h-6" /> },
  ] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!building || !room || !description) {
      toast.error('请填写必填项', { description: '楼栋号、宿舍号和故障描述为必填项' });
      return;
    }
    if (description.length < 10) {
      toast.error('故障描述太短', { description: '请至少输入10个字符描述故障情况' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await ticketsApi.create({ building, room, faultType, description, contact: contact || undefined });
      if (res.success) {
        toast.success('报修申请已提交！', { description: `工单号：${res.data.ticketNo}，我们将尽快安排维修人员。` });
        setBuilding(''); setRoom(''); setDescription(''); setContact('');
        setFaultType('electric');
        onSuccess();
      } else {
        toast.error('提交失败', { description: res.message });
      }
    } catch {
      toast.error('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Left info panel */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 bg-[#1E3A5F]/10 rounded-full px-3 py-1 mb-4">
              <Plus className="w-3.5 h-3.5 text-[#1E3A5F]" />
              <span className="text-[#1E3A5F] text-xs font-semibold uppercase tracking-wide">在线报修</span>
            </div>
            <h2 className="font-[system-ui] text-3xl font-bold text-[#1A202C] mb-4">提交维修申请</h2>
            <p className="text-[#64748B] leading-relaxed mb-8">填写报修信息后，系统将自动通知维修人员，并在工单状态变更时向您推送消息。</p>
            <div className="space-y-4">
              {[
                { icon: <Zap className="w-4 h-4 text-[#1E3A5F]" />, bg: 'bg-[#1E3A5F]/10', title: '快速响应', desc: '平均 8.5 小时内安排维修人员上门' },
                { icon: <AlertCircle className="w-4 h-4 text-green-600" />, bg: 'bg-green-50', title: '实时通知', desc: '工单状态变更时即时推送消息提醒' },
                { icon: <Star className="w-4 h-4 text-[#F59E0B]" />, bg: 'bg-[#F59E0B]/10', title: '服务评价', desc: '维修完成后可对服务质量进行评分' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>{item.icon}</div>
                  <div>
                    <div className="font-semibold text-sm text-[#1A202C]">{item.title}</div>
                    <div className="text-xs text-[#64748B]">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-3">
          <div className="bg-[#F0F4F8] rounded-2xl p-6 sm:p-8 border border-[#CBD5E1]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#1A202C] mb-2">楼栋号 <span className="text-red-500">*</span></label>
                  <select
                    value={building}
                    onChange={e => setBuilding(e.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#2E6DA4] focus:border-transparent transition-all"
                  >
                    <option value="">请选择楼栋</option>
                    {['1', '2', '3', '4', '5', '6', '7', '8'].map(b => (
                      <option key={b} value={b}>{b}号楼</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A202C] mb-2">宿舍号 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                    placeholder="例如：412"
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-sm text-[#1A202C] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2E6DA4] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1A202C] mb-3">故障类型 <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {faultTypes.map(ft => (
                    <button
                      key={ft.value}
                      type="button"
                      onClick={() => setFaultType(ft.value)}
                      className={`flex flex-col items-center gap-2 p-3 bg-white border-2 rounded-xl transition-all ${
                        faultType === ft.value
                          ? 'border-[#2E6DA4] bg-blue-50'
                          : 'border-[#CBD5E1] hover:border-[#2E6DA4]/50'
                      }`}
                    >
                      <span className={faultType === ft.value ? 'text-[#2E6DA4]' : 'text-[#64748B]'}>{ft.icon}</span>
                      <span className="text-xs font-medium text-[#1A202C]">{ft.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1A202C] mb-2">故障描述 <span className="text-red-500">*</span></label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder="请详细描述故障情况，例如：书桌上方灯管不亮，已尝试更换灯泡但无效..."
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-3 text-sm text-[#1A202C] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2E6DA4] focus:border-transparent transition-all resize-none"
                />
                <p className="text-xs text-[#64748B] mt-1">{description.length}/10 最少字符</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1A202C] mb-2">联系方式</label>
                <input
                  type="tel"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  placeholder="请输入您的手机号码"
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-sm text-[#1A202C] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2E6DA4] focus:border-transparent transition-all"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[#1E3A5F] hover:bg-[#2E6DA4] text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-md disabled:opacity-60 min-h-[44px]"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? '提交中...' : '提交报修申请'}
                </button>
                <button
                  type="reset"
                  onClick={() => { setBuilding(''); setRoom(''); setDescription(''); setContact(''); setFaultType('electric'); }}
                  className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#1A202C] font-medium px-4 py-3 rounded-lg border border-[#CBD5E1] hover:border-[#64748B] transition-all duration-200 min-h-[44px]"
                >
                  <RotateCcw className="w-4 h-4" />
                  重置
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Reviews List
// ============================================
const ReviewsList = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await reviewsApi.getAll();
        if (res.success) setReviews(res.data);
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetch();
  }, []);

  const avatarColors = ['bg-[#2E6DA4]', 'bg-[#F59E0B]', 'bg-[#DC2626]', 'bg-[#16A34A]', 'bg-[#1E3A5F]'];

  if (loading) return <div className="text-center py-12 text-[#64748B]">加载中...</div>;

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-8">
        <h2 className="font-[system-ui] text-2xl font-bold text-[#1A202C] mb-1">维修评价</h2>
        <p className="text-[#64748B] text-sm">查看所有用户的维修服务评价</p>
      </div>
      {reviews.length === 0 ? (
        <div className="text-center py-16 text-[#64748B]">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>暂无评价</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, idx) => {
            const tags = review.tags ? JSON.parse(review.tags) as string[] : [];
            const studentName = review.student?.name || '匿名用户';
            const initial = studentName.charAt(0);
            const colorClass = avatarColors[idx % avatarColors.length];
            return (
              <div key={review.id} className="bg-white rounded-xl p-5 border border-[#CBD5E1] shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${colorClass} flex items-center justify-center`}>
                      <span className="text-white text-xs font-bold">{initial}</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#1A202C]">{studentName}</div>
                      {review.ticket && (
                        <div className="text-xs text-[#64748B]">{review.ticket.building}号楼 {review.ticket.room}室</div>
                      )}
                    </div>
                  </div>
                  <StarRating value={review.rating} size="sm" />
                </div>
                {review.comment && <p className="text-sm text-[#64748B] leading-relaxed mb-3">{review.comment}</p>}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag: string) => (
                      <span key={tag} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="mt-3 text-xs text-[#64748B]">{new Date(review.createdAt).toLocaleDateString('zh-CN')}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================
// Main Index Component
// ============================================
const Index = () => {
  const { logout } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role || 'student';
        if (role === 'admin') return 'admin';
        if (role === 'worker') return 'worker';
      } catch { /* ignore */ }
    }
    return 'home';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, inProgress: 0, completionRate: 96, avgRating: 4.6 });
  const [userInfo, setUserInfo] = useState<{ name: string; role: string } | null>(null);

  // Update user info when token changes
  useEffect(() => {
    const updateUserInfo = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserInfo({ 
            name: payload.name || payload.email || '用户', 
            role: payload.role || 'student' 
          });
        } catch { /* ignore */ }
      } else {
        setUserInfo(null);
      }
    };
    
    updateUserInfo();
    
    // Listen for storage changes (e.g., when token is set/removed)
    window.addEventListener('storage', updateUserInfo);
    
    return () => window.removeEventListener('storage', updateUserInfo);
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const res = await ticketsApi.getMyTickets();
      if (res.success) setTickets(res.data);
    } catch { /* ignore */ }
    setLoadingTickets(false);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await ticketsApi.getStats();
      if (res.success) setStats(prev => ({ ...prev, ...res.data }));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchTickets();
      await fetchStats();
    };
    void load();
  }, [fetchTickets, fetchStats]);

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { view: 'home' as AppView, label: '首页', icon: <Building2 className="w-4 h-4" /> },
    { view: 'submit' as AppView, label: '提交报修', icon: <Plus className="w-4 h-4" /> },
    { view: 'my-tickets' as AppView, label: '我的工单', icon: <ClipboardList className="w-4 h-4" /> },
    { view: 'reviews' as AppView, label: '维修评价', icon: <Star className="w-4 h-4" /> },
  ];

  const adminNavItems = [
    { view: 'admin' as AppView, label: '管理后台', icon: <Wrench className="w-4 h-4" /> },
    { view: 'reviews' as AppView, label: '评价管理', icon: <Star className="w-4 h-4" /> },
  ];

  const workerNavItems = [
    { view: 'worker' as AppView, label: '我的任务', icon: <Wrench className="w-4 h-4" /> },
    { view: 'reviews' as AppView, label: '我的评价', icon: <Star className="w-4 h-4" /> },
  ];

  const activeNavItems = userInfo?.role === 'admin' ? adminNavItems : userInfo?.role === 'worker' ? workerNavItems : navItems;

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setCurrentView('ticket-detail');
  };

  const handleBackFromDetail = () => {
    setSelectedTicket(null);
    setCurrentView('my-tickets');
  };

  const recentTickets = tickets.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      {/* Navbar */}
      <nav className="bg-[#1E3A5F] shadow-lg sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F59E0B] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-[system-ui] font-bold text-lg tracking-tight">宿舍保修系统</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              {activeNavItems.map(item => (
                <button
                  key={item.view}
                  onClick={() => { setCurrentView(item.view); setSelectedTicket(null); }}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 ${
                    currentView === item.view ? 'text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#2E6DA4] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{userInfo?.name?.charAt(0) || '用'}</span>
                </div>
                <span className="text-white/90 text-sm">{userInfo?.name || '用户'}</span>
                {userInfo?.role && userInfo.role !== 'student' && (
                  <span className="text-xs bg-[#F59E0B]/20 text-[#F59E0B] px-2 py-0.5 rounded-full">
                    {userInfo.role === 'admin' ? '管理员' : '维修员'}
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white p-1"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1E3A5F] border-t border-white/10 px-4 py-3 space-y-1">
            {activeNavItems.map(item => (
              <button
                key={item.view}
                onClick={() => { setCurrentView(item.view); setSelectedTicket(null); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentView === item.view ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <div className="border-t border-white/10 pt-2 mt-2">
              <div className="flex items-center gap-2 px-3 py-2 text-white/70 text-sm">
                <User className="w-4 h-4" />
                <span>{userInfo?.name || '用户'}</span>
              </div>
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Admin View */}
      {currentView === 'admin' && <AdminView />}

      {/* Worker View */}
      {currentView === 'worker' && <WorkerView />}

      {/* Student Views */}
      {(userInfo?.role === 'student' || !userInfo) && (
        <>
          {/* Hero Section */}
          {currentView === 'home' && (
            <section className="bg-[#1E3A5F] pb-16 pt-12 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#2E6DA4] blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#F59E0B] blur-3xl" />
              </div>
              <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-[#F59E0B]/20 border border-[#F59E0B]/30 rounded-full px-4 py-1.5 mb-6">
                      <div className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
                      <span className="text-[#F59E0B] text-xs font-semibold tracking-wide uppercase">系统运行正常</span>
                    </div>
                    <h1 className="font-[system-ui] text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                      宿舍报修<br /><span className="text-[#F59E0B]">一键搞定</span>
                    </h1>
                    <p className="text-white/70 text-lg leading-relaxed mb-8">
                      告别纸质报修单，在线提交维修申请，实时追踪进度，让宿舍问题快速解决。平均响应时间{' '}
                      <strong className="text-white">12小时以内</strong>。
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <button
                        onClick={() => setCurrentView('submit')}
                        className="inline-flex items-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
                      >
                        <Plus className="w-4 h-4" />
                        立即报修
                      </button>
                      <button
                        onClick={() => setCurrentView('my-tickets')}
                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-lg border border-white/20 transition-all duration-200"
                      >
                        <ClipboardList className="w-4 h-4" />
                        查看进度
                      </button>
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <img
                      src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80"
                      alt="宿舍维修"
                      className="rounded-2xl shadow-2xl w-full object-cover h-72 opacity-90"
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Stats Bar */}
          {currentView === 'home' && (
            <section className="bg-white border-b border-[#CBD5E1] shadow-sm">
              <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#CBD5E1]">
                  {[
                    { value: stats.total || 1248, label: '累计报修工单', color: 'text-[#1E3A5F]' },
                    { value: `${stats.completionRate || 96}%`, label: '按时完成率', color: 'text-green-600' },
                    { value: '8.5h', label: '平均响应时间', color: 'text-[#2E6DA4]' },
                    { value: `${stats.avgRating || 4.6}★`, label: '用户满意度', color: 'text-[#F59E0B]' },
                  ].map((stat, i) => (
                    <div key={i} className="py-6 px-4 sm:px-6 text-center">
                      <div className={`text-2xl sm:text-3xl font-bold font-[system-ui] ${stat.color} mb-1`}>{stat.value}</div>
                      <div className="text-xs sm:text-sm text-[#64748B]">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Main Content */}
          <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Home - Recent Tickets */}
            {currentView === 'home' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-[system-ui] text-2xl font-bold text-[#1A202C] mb-1">我的报修工单</h2>
                    <p className="text-[#64748B] text-sm">实时追踪您的维修申请进度</p>
                  </div>
                  <button
                    onClick={() => setCurrentView('my-tickets')}
                    className="text-[#2E6DA4] text-sm font-medium hover:underline flex items-center gap-1"
                  >
                    查看全部 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {loadingTickets ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white rounded-xl border border-[#CBD5E1] h-48 animate-pulse" />
                    ))}
                  </div>
                ) : recentTickets.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-[#CBD5E1]">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 text-[#CBD5E1]" />
                    <p className="text-[#64748B] mb-4">暂无报修工单</p>
                    <button
                      onClick={() => setCurrentView('submit')}
                      className="inline-flex items-center gap-2 bg-[#1E3A5F] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#2E6DA4] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      立即报修
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {recentTickets.map(ticket => (
                      <TicketCard key={ticket.id} ticket={ticket} onSelect={handleSelectTicket} />
                    ))}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { icon: <Plus className="w-6 h-6 text-[#1E3A5F]" />, title: '提交报修', desc: '在线填写报修单，快速提交维修申请', view: 'submit' as AppView, bg: 'bg-[#1E3A5F]/5' },
                    { icon: <ClipboardList className="w-6 h-6 text-[#2E6DA4]" />, title: '查看工单', desc: '查看所有报修工单及维修进度', view: 'my-tickets' as AppView, bg: 'bg-blue-50' },
                    { icon: <Star className="w-6 h-6 text-[#F59E0B]" />, title: '维修评价', desc: '对已完成的维修服务进行评价', view: 'reviews' as AppView, bg: 'bg-[#F59E0B]/10' },
                  ].map((action, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentView(action.view)}
                      className="flex items-start gap-4 p-5 bg-white rounded-xl border border-[#CBD5E1] shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 text-left"
                    >
                      <div className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center flex-shrink-0`}>
                        {action.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-[#1A202C] mb-1">{action.title}</div>
                        <div className="text-sm text-[#64748B]">{action.desc}</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#CBD5E1] ml-auto flex-shrink-0 mt-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Form */}
            {currentView === 'submit' && (
              <SubmitForm onSuccess={() => { fetchTickets(); setCurrentView('my-tickets'); }} />
            )}

            {/* My Tickets */}
            {currentView === 'my-tickets' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-[system-ui] text-2xl font-bold text-[#1A202C] mb-1">我的报修工单</h2>
                    <p className="text-[#64748B] text-sm">共 {tickets.length} 条工单记录</p>
                  </div>
                  <button
                    onClick={() => setCurrentView('submit')}
                    className="inline-flex items-center gap-2 bg-[#1E3A5F] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#2E6DA4] transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    新建报修
                  </button>
                </div>
                {loadingTickets ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl border border-[#CBD5E1] h-48 animate-pulse" />)}
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-[#CBD5E1]">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 text-[#CBD5E1]" />
                    <p className="text-[#64748B] mb-4">暂无报修工单</p>
                    <button
                      onClick={() => setCurrentView('submit')}
                      className="inline-flex items-center gap-2 bg-[#1E3A5F] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#2E6DA4] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      立即报修
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tickets.map(ticket => (
                      <TicketCard key={ticket.id} ticket={ticket} onSelect={handleSelectTicket} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Ticket Detail */}
            {currentView === 'ticket-detail' && selectedTicket && (
              <TicketDetail
                ticket={selectedTicket}
                onBack={handleBackFromDetail}
                onReviewSubmitted={fetchTickets}
              />
            )}

            {/* Reviews */}
            {currentView === 'reviews' && <ReviewsList />}
          </main>
        </>
      )}

      {/* Footer */}
      <footer className="bg-[#1E3A5F] text-white/70 py-10 mt-auto">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#F59E0B] flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold">宿舍保修系统</span>
              </div>
              <p className="text-sm leading-relaxed">数字化宿舍维修管理平台，让每一次报修都高效透明。</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">快速链接</h4>
              <ul className="space-y-2 text-sm">
                {[['提交报修', 'submit'], ['进度查询', 'my-tickets'], ['维修评价', 'reviews']].map(([label, view]) => (
                  <li key={view}>
                    <button onClick={() => setCurrentView(view as AppView)} className="hover:text-white transition-colors">{label}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">联系我们</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" />宿管办公室：0571-8888-0000</li>
                <li className="flex items-center gap-2"><Clock className="w-4 h-4" />服务时间：周一至周日 8:00-22:00</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs">© 2026 宿舍保修系统. 保留所有权利.</p>
            <p className="text-xs">平均响应时间 8.5h · 满意度 {stats.avgRating || 4.6}/5 · 完成率 {stats.completionRate || 96}%</p>
          </div>
        </div>
      </footer>

      <OmniflowBadge />
    </div>
  );
};

export default Index;
