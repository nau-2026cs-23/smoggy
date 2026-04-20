import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../lib/api';
import { toast } from 'sonner';
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    if (!email || !password) {
      setError('请填写邮箱和密码');
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      if (data.success && data.data?.token) {
        login(data.data.token);
        toast.success('登录成功', { description: `欢迎回来，${data.data.user?.name || ''}` });
        navigate('/', { replace: true });
      } else {
        setError(data.message || '邮箱或密码错误');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1E3A5F] mb-4 shadow-lg">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A202C] font-[system-ui]">宿舍保修系统</h1>
          <p className="text-[#64748B] text-sm mt-1">登录您的账户</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#CBD5E1] p-8">
          <h2 className="text-xl font-bold text-[#1A202C] mb-6">账户登录</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <label className="block text-sm font-semibold text-[#1A202C] mb-2">
                密码 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full bg-[#F0F4F8] border border-[#CBD5E1] rounded-lg px-4 py-2.5 pr-10 text-sm text-[#1A202C] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2E6DA4] focus:border-transparent transition-all"
                  autoComplete="current-password"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#1E3A5F] hover:bg-[#2E6DA4] text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md min-h-[44px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#64748B]">
              还没有账户？{' '}
              <Link to="/signup" className="text-[#2E6DA4] font-semibold hover:underline">
                立即注册
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

export default Login;
