import { Suspense, useCallback, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function PageFallback() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="animate-spin border-4 border-indigo-500 border-t-transparent rounded-full w-8 h-8" />
    </div>
  );
}

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const location = useLocation();

  // Sayfa değişince (ör. hatırlatma popup'ından kişiye gidince) mobil menüyü kapat.
  // Effect yerine render sırasında: https://react.dev/learn/you-might-not-need-an-effect
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setMobileMenuOpen(false);
  }

  return (
    <div className="relative flex h-dvh overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40 text-slate-900 dark:text-slate-100">
      {/* Decoratif mesh blob'lar — sayfa scroll'undan etkilenmez, blur ile yumuşar */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-indigo-300/40 dark:bg-indigo-600/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-violet-300/40 dark:bg-violet-600/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-fuchsia-200/40 dark:bg-fuchsia-700/15 blur-3xl" />
      </div>

      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={closeMobileMenu} />

      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
        {/* Mobil üst çubuk: masaüstünde gizli */}
        <header className="md:hidden flex-shrink-0 flex items-center gap-3 px-4 py-3
          bg-white/70 dark:bg-slate-950/60 backdrop-blur-2xl
          border-b border-slate-200/60 dark:border-white/10">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg text-xl leading-none text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            aria-label="Menüyü aç"
            aria-controls="app-sidebar"
            aria-expanded={mobileMenuOpen}
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white text-xs font-bold">
              C
            </div>
            <span className="font-bold text-base bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">
              CRM
            </span>
          </div>
        </header>

        <main className="flex flex-1 min-h-0 overflow-hidden">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
