import { useTheme } from "../context/ThemeContext";

function formatLastUpdated(date) {
  if (!date) return null;
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 10) return "à l'instant";
  if (diff < 60) return `il y a ${diff}s`;
  if (diff < 120) return "il y a 1 min";
  return `il y a ${Math.floor(diff / 60)} min`;
}

export default function Navbar({ refreshing = false, lastUpdated = null, onRefresh, onLogout }) {
  const { isDark, setIsDark } = useTheme();

  return (
    <header className="nav-el sticky top-0 z-20 flex items-center justify-between border-b border-gray-800 bg-gray-950/90 px-6 py-4 backdrop-blur">
      <div>
        <h2 className="text-lg font-semibold text-white">Centre de supervision</h2>
        <p className="text-sm text-gray-400">Surveillance temps réel</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Indicateur de statut de rafraîchissement */}
        <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 text-sm">
          {refreshing ? (
            <>
              <svg
                className="h-3.5 w-3.5 animate-spin text-cyan-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                />
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

        {/* Bouton refresh manuel */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            title="Actualiser les statuts"
            className="rounded-xl border border-gray-700 bg-gray-900 p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}

        {/* Toggle dark/light */}
        <button
          className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-200 transition hover:bg-gray-800"
          onClick={() => setIsDark(!isDark)}
        >
          {isDark ? "Mode clair" : "Mode sombre"}
        </button>

        <button className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-200 transition hover:bg-gray-800">
          Paramètres
        </button>

        {/* Déconnexion */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Se déconnecter"
            className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/20 flex items-center gap-2"
          >
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