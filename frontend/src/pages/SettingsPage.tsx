import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';

const ENV_INFO: { key: string; label: string }[] = [
  { key: import.meta.env.VITE_API_BASE ?? '/api/v1', label: 'API 地址' },
  { key: import.meta.env.VITE_LLM_PROVIDER ?? 'deepseek（默认）', label: 'LLM Provider' },
];

/** 设置页：主题 / 账户 / 环境信息（轻量） */
export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const dark = useUiStore((s) => s.dark);
  const setDark = useUiStore((s) => s.setDark);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">⚙️ 设置</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          个性化你的知识花园
        </p>
      </header>

      <section className="rounded-2xl border border-emerald-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
          🎨 外观
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
              深色模式
            </div>
            <div className="text-xs text-slate-400">夜间护眼，花园同样绿意盎然</div>
          </div>
          <button
            onClick={() => setDark(!dark)}
            className={
              'relative h-7 w-13 rounded-full transition-colors ' +
              (dark ? 'bg-emerald-600' : 'bg-slate-300')
            }
            style={{ width: '3.25rem' }}
            aria-label="切换深色模式"
          >
            <span
              className={
                'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ' +
                (dark ? 'left-6.5' : 'left-0.5')
              }
              style={{ left: dark ? '1.6rem' : '0.125rem' }}
            />
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
          👤 账户
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">邮箱</span>
            <span className="text-slate-700 dark:text-slate-200">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">昵称</span>
            <span className="text-slate-700 dark:text-slate-200">
              {user?.display_name || '未设置'}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-4 rounded-xl border border-red-100 px-4 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
        >
          退出登录
        </button>
      </section>

      <section className="rounded-2xl border border-emerald-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
          🛠 环境信息
        </h2>
        <div className="space-y-2 text-sm">
          {ENV_INFO.map((e) => (
            <div key={e.label} className="flex justify-between">
              <span className="text-slate-400">{e.label}</span>
              <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                {e.key}
              </span>
            </div>
          ))}
          <div className="flex justify-between">
            <span className="text-slate-400">前端版本</span>
            <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
              v0.1.0
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
