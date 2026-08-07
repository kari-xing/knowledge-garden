import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { useQuickCaptureShortcut } from '../../hooks/useShortcut';

const NAV = [
  { to: '/garden', icon: '🏡', label: '花园首页' },
  { to: '/notes', icon: '📝', label: '笔记' },
  { to: '/graph', icon: '🕸️', label: '知识图谱' },
  { to: '/search', icon: '🔍', label: '搜索' },
  { to: '/tags', icon: '🏷️', label: '标签' },
  { to: '/settings', icon: '⚙️', label: '设置' },
];

interface LayoutProps {
  onOpenQuickCapture?: () => void;
}

/** 主布局：侧边栏 + 内容区 + 全局快捷键捕获 */
export default function Layout({ onOpenQuickCapture }: LayoutProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const dark = useUiStore((s) => s.dark);
  const setDark = useUiStore((s) => s.setDark);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCapture = onOpenQuickCapture ?? (() => {});
  useQuickCaptureShortcut(handleCapture);

  return (
    <div className="flex min-h-screen">
      {/* 侧边栏 */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-emerald-100 bg-white/80 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/80">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="text-2xl">🌿</span>
          <div>
            <div className="text-base font-bold text-emerald-700 dark:text-emerald-300">
              藤蔓 · 知识花园
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500">
              Second Brain
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-emerald-200',
                )
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-2 border-t border-emerald-100 px-4 py-4 dark:border-slate-700/60">
          <button
            onClick={handleCapture}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            ⚡ 快速捕获
            <kbd className="rounded bg-white/20 px-1.5 text-[10px] font-normal">
              Ctrl+Shift+K
            </kbd>
          </button>
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                {user?.display_name || user?.email || '游客'}
              </div>
              <button
                onClick={handleLogout}
                className="mt-0.5 text-xs text-slate-400 hover:text-red-500"
              >
                退出登录
              </button>
            </div>
            <button
              onClick={() => setDark(!dark)}
              className="rounded-lg border border-emerald-100 px-2 py-1 text-sm transition-colors hover:bg-emerald-50 dark:border-slate-600 dark:hover:bg-slate-700"
              title="切换深色模式"
            >
              {dark ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </aside>

      {/* 内容区 */}
      <main className="ml-56 flex-1 px-8 py-7">
        <Outlet />
      </main>
    </div>
  );
}
