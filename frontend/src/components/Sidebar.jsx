import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import ThemeToggle from "./ThemeToggle";
import RemindersBell from "./RemindersBell";

const menuItems = [
  { to: "/dashboard", icon: "🏠", label: "Anasayfa" },
  { to: "/mesajlar", icon: "💬", label: "Mesajlar" },
  { to: "/kisiler", icon: "👤", label: "Kişiler" },
  { to: "/hatirlatmalar", icon: "🔔", label: "Hatırlatmalar" },
  { to: "/odemeler", icon: "💳", label: "Ödemeler", adminOnly: true },
  { to: "/reklam-analizi", icon: "📊", label: "Reklam Analizi", adminOnly: true },
  { to: "/kampanya-durumlari", icon: "🚦", label: "Kampanya Durumları", adminOnly: true },
  { to: "/grafikler", icon: "📈", label: "Grafikler", adminOnly: true },
  { to: "/hazir-mesajlar", icon: "⚡", label: "Hazır Mesajlar" },
  { to: "/seminer-formlari", icon: "🎓", label: "Seminer Formları" },
  { to: "/hatalar", icon: "🐛", label: "Hata Takibi" },
  { to: "/parametreler", icon: "⚙️", label: "Parametreler" },
  { to: "/kullanicilar", icon: "👥", label: "Kullanıcılar", adminOnly: true },
  { to: "/gelistirici", icon: "🛠️", label: "Geliştirici", ownerOnly: true },
];

// Tailwind'in `md` kırılımı (768px) ile aynı: altı mobil (çekmece menü), üstü masaüstü.
const DESKTOP_QUERY = "(min-width: 768px)";
const COLLAPSE_KEY = "sidebar-collapsed";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
}


/**
 * Masaüstü (md+): solda sabit, daraltılabilir menü. Menü listesi kendi içinde kayar,
 * alt kısım (hatırlatma, tema, kullanıcı, çıkış) her zaman görünür kalır.
 * Mobil: Layout'taki üst çubuktaki ☰ ile açılan, soldan kayan çekmece.
 */
export default function Sidebar({ mobileOpen = false, onMobileClose = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === "1"; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0"); } catch { /* yoksay */ }
  }, [collapsed]);

  // Mobilde çekmece açıkken Esc ile kapat.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => e.key === "Escape" && onMobileClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, onMobileClose]);

  // Mobil çekmecede menü her zaman tam genişlikte (etiketli) gösterilir.
  const expanded = isDesktop ? !collapsed : true;

  const visible = menuItems.filter(
    (m) => (!m.adminOnly || user?.role === "admin") && (!m.ownerOnly || user?.is_owner)
  );

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Mobil arka plan karartması */}
      <div
        aria-hidden
        onClick={onMobileClose}
        className={`fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="app-sidebar"
        inert={!isDesktop && !mobileOpen}
        className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] transform transition-[transform,width] duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:z-auto md:max-w-none md:translate-x-0 ${collapsed ? "md:w-16" : "md:w-60"}
          flex-shrink-0 flex flex-col h-dvh md:h-full
          bg-white/95 md:bg-white/70 dark:bg-slate-950/95 md:dark:bg-slate-950/60 backdrop-blur-2xl
          border-r border-slate-200/60 dark:border-white/10`}
      >
        {/* Logo + toggle */}
        <div className={`flex items-center ${expanded ? "justify-between" : "justify-center"} p-4 [@media(max-height:760px)]:py-3 flex-shrink-0`}>
          {expanded && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white text-sm font-bold">
                C
              </div>
              <span className="font-bold text-base bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">
                CRM
              </span>
            </div>
          )}
          <button
            onClick={() => (isDesktop ? setCollapsed(!collapsed) : onMobileClose())}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            title={!isDesktop ? "Menüyü kapat" : collapsed ? "Genişlet" : "Daralt"}
            aria-label={!isDesktop ? "Menüyü kapat" : collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          >
            {expanded ? "✕" : "☰"}
          </button>
        </div>

        {/* Menü: ekrana sığmazsa kendi içinde kayar */}
        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pb-2 space-y-1">
          {visible.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onMobileClose}
              title={expanded ? undefined : item.label}
              className={({ isActive }) =>
                `relative w-full flex items-center gap-3 px-3 py-2.5 [@media(max-height:760px)]:py-1.5 rounded-xl text-sm font-medium transition-all ${
                  expanded ? "" : "justify-center"
                } ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500/15 to-violet-500/15 text-indigo-700 dark:text-indigo-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-white/5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                  )}
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  {expanded && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer: reminders + theme toggle + user + logout — her zaman görünür */}
        <div className={`flex-shrink-0 p-3 [@media(max-height:760px)]:p-2 border-t border-slate-200/60 dark:border-white/10 space-y-2 [@media(max-height:760px)]:space-y-1.5`}>
          <RemindersBell expanded={expanded} />
          <ThemeToggle expanded={expanded} />
          {expanded ? (
            <div className={`rounded-xl p-3 [@media(max-height:760px)]:p-2 bg-white/60 dark:bg-white/5 backdrop-blur border border-slate-200/60 dark:border-white/10`}>
              <div className={`flex items-center gap-2 mb-2 [@media(max-height:760px)]:mb-1`}>
                <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-semibold shadow-md shadow-indigo-500/30">
                  {(user?.full_name || user?.username || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">
                    {user?.full_name || user?.username}
                  </div>
                  {user?.role === "admin" && (
                    <div className="text-[10px] uppercase tracking-wider text-indigo-500 dark:text-indigo-400 font-semibold">
                      Admin
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-xs font-medium rounded-lg py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                ⎋ Çıkış Yap
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              title="Çıkış"
              aria-label="Çıkış yap"
              className="w-full text-rose-500 hover:text-rose-400 text-lg py-1 transition-colors"
            >
              ⎋
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
