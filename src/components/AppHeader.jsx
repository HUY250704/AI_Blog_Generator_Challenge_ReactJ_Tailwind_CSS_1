import { Moon, PenTool, Sun } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navLinkClass = ({ isActive }) =>
  `px-2 py-1 text-[14px] font-semibold transition ${
    isActive ? 'text-slate-950 dark:text-white' : 'text-slate-950 hover:text-slate-700 dark:text-white dark:hover:text-slate-200'
  }`;

const AppHeader = ({ isDark, onToggleTheme }) => {
  return (
    <header className="border-b border-slate-300 bg-white dark:border-slate-800 dark:bg-black">
      <div className="mx-auto flex h-[70px] w-full max-w-[1424px] items-center justify-between px-4">
        <div className="flex items-center gap-5">
          <PenTool className="h-7 w-7 text-black dark:text-white" strokeWidth={2.2} />
          <p className="text-[24px] font-bold leading-none text-black dark:text-white">
            AI Blog Generator
          </p>
        </div>

        <nav className="flex items-center gap-9">
          <NavLink to="/editor" className={navLinkClass}>
            Editor
          </NavLink>
          <NavLink to="/history" className={navLinkClass}>
            History
          </NavLink>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-slate-300 bg-white text-black transition hover:bg-slate-100 dark:border-slate-700 dark:bg-black dark:text-white dark:hover:bg-slate-900"
          >
            {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
