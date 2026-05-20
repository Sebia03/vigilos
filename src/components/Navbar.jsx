import { useTheme } from "../context/ThemeContext";

function formatLastUpdated(date) {
  if (!date) return null;
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 10) return "à l'instant";
  if (diff < 60) return `il y a ${diff}s`;
  if (diff < 120) return "il y a 1 min";
  return `il y a ${Math.floor(diff / 60)} min`;
}

export default function Navbar({ refreshing = false, lastUpdated = null, onRefresh, onLogout, currentUser, onSettings }) {
  const { isDark, setIsDark } = useTheme();

  return (
    <header className="nav-el sticky top-0 z-20 flex items-center justify-between border-b border-gray-800 bg-gray-950/90 px-6 py-4 backdrop-blur">
      <div>
        <h2 className="text-lg font-semibold text-white">Centre de supervision</h2>
        <p className="text-sm text-gray-400">Surveillance temps réel</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Indicateur statut */}
        <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 text-sm">
          {refreshing ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              <span className="text-xs text-cyan-400">Actualisation...</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs text-gray-400">
                {lastUpdated ? formatLastUpdated(lastUpdated) : "En attente"}
              </span>
            </>
          )}
        </div>

        {/* Bouton refresh */}
        {onRefresh && (
          <button onClick={onRefresh} disabled={refreshing} title="Actualiser les statuts"
            className="rounded-xl border border-gray-700 bg-gray-900 p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white disabled:opacity-50">
            <svg className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}

        {/* Toggle dark/light */}
        <button onClick={() => setIsDark(!isDark)}
          className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-200 transition hover:bg-gray-800">
          {isDark ? "Mode clair" : "Mode sombre"}
        </button>

        {/* Paramètres — visible pour tous, contenu adapté selon le rôle */}
        <button onClick={onSettings}
          className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-200 transition hover:bg-gray-800 flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Paramètres
        </button>

        {/* Déconnexion */}
        {onLogout && (
          <button onClick={onLogout} title="Se déconnecter"
            className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/20 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        )}
      </div>
    </header>
  );
}