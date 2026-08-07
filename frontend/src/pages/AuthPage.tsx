import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { login, register } from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';

type Mode = 'login' | 'register';

/** 登录 / 注册 */
export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const toast = useUiStore((s) => s.toast);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res =
        mode === 'login'
          ? await login({ email, password })
          : await register({ email, password, display_name: displayName || null });
      setAuth(res.token, res.user);
      toast(
        mode === 'login'
          ? `欢迎回来，${res.user.display_name || res.user.email} 🌿`
          : '注册成功，开始打造你的知识花园 🌱',
        'success',
      );
      navigate('/garden', { replace: true });
    } catch (err) {
      toast((err as Error).message || '操作失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md animate-slide-up rounded-3xl border border-emerald-100 bg-white/90 p-8 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-800/90">
        <div className="mb-6 text-center">
          <div className="text-5xl">🌿</div>
          <h1 className="mt-3 text-xl font-bold text-emerald-700 dark:text-emerald-300">
            藤蔓 · 知识花园
          </h1>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            把知识种进去，让 AI 帮你浇水施肥
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-xl bg-emerald-50 p-1 dark:bg-slate-700/50">
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={clsx(
                'rounded-lg py-2 text-sm font-medium transition-colors',
                mode === m
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-300'
                  : 'text-slate-500 dark:text-slate-400',
              )}
            >
              {m === 'login' ? '登录' : '注册'}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          {mode === 'register' && (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="昵称（可选）"
              className="w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-400 focus:bg-white dark:border-slate-600 dark:bg-slate-700/40 dark:focus:bg-slate-700"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            className="w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-400 focus:bg-white dark:border-slate-600 dark:bg-slate-700/40 dark:focus:bg-slate-700"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码（至少 6 位）"
            className="w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-400 focus:bg-white dark:border-slate-600 dark:bg-slate-700/40 dark:focus:bg-slate-700"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? '请稍候…'
              : mode === 'login'
                ? '进入花园'
                : '注册并进入'}
          </button>
        </form>
      </div>
    </div>
  );
}
