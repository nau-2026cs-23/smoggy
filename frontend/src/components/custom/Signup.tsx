import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../lib/api';
import { toast } from 'sonner';
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react';

const Signup = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'worker' | 'admin'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated === true) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password || !confirmPassword) {
      setError('请填写所有必填项');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (password.length < 6) {
      setError('密码至少需要6位字符');
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.signup(name, email, password, confirmPassword);
      if (data.success && data.data?.token) {
        login(data.data.token);
        toast.success('注册成功', { description: `欢迎加入，${name}！` });
        navigate('/', { replace: true });
      } else {
        setError(data.message || '注册失败，请重试');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1E3A5F] mb-4 shadow-lg">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A202C] font-[system-ui]">宿舍保修系统</h1>
          <p className="text-[#64748B] text-sm mt-1">创建您的账户</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#CBD5E1] p-8">
          <h2 className="text-xl font-bold text-[#1A202C] mb-6">注册账户</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#1A202C] mb-2">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入您的姓名"
                className="w-full bg-[#F0F4F8] border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-sm text-[#1A202C] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2E6DA4] focus:border-transparent transition-all"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A202C] mb-2">
                邮箱地址 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                className="w-full bg-[#F0F4F8] border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-sm text-[#1A202C] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2E6DA4] focus:border-transparent transition-all"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A202C] mb-2">账户角色</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'student' | 'worker' | 'admin')}
                className="w-full bg-[#F0F4F8] border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#2E6DA4] focus:border-transparent transition-all"
              >
                <option value="student">学生</option>
                <option value="worker">维修人员</option>
                <option value="admin">管理员</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A202C] mb-2">
                密码 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少6位字符"
                  className="w-full bg-[#F0F4F8] border border-[#CBD5E1] rounded-lg px-4 py-2.5 pr-10 text-sm text-[#1A202C] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2E6DA4] focus:border-transparent transition-all"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1A202C] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A202C] mb-2">
                确认密码 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                className="w-full bg-[#F0F4F8] border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-sm text-[#1A202C] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2E6DA4] focus:border-transparent transition-all"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#1E3A5F] hover:bg-[#2E6DA4] text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md min-h-[44px] mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? '注册中...' : '立即注册'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#64748B]">
              已有账户？{' '}
              <Link to="/login" className="text-[#2E6DA4] font-semibold hover:underline">
                立即登录
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[#64748B] mt-6">
          © 2026 宿舍保修系统. 保留所有权利.
        </p>
      </div>
    </div>
  );
};

export default Signup;
