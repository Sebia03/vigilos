import { useEffect, useRef, useState } from "react";
import ImouPlayer from "../components/ImouPlayer";
import { fetchAlerts } from "../services/ImouService";

const BASE_URL = "http://127.0.0.1:5000";
const MAX_LIVE_SLOTS = 4;

function proxyImageUrl(url) {
  if (!url) return null;
  return `${BASE_URL}/image-proxy?url=${encodeURIComponent(url)}`;
}

// ─── Fullscreen overlay ───────────────────────────────────────────────────────
function CameraFullscreen({ camera, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.classList.add("imou-fullscreen-active");
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.classList.remove("imou-fullscreen-active");
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black"
      onDoubleClick={onClose}
    >
      <div style={{ width: "90vw", maxWidth: "1200px" }}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="font-mono text-sm text-gray-200">{camera.name}</span>
            <span className="font-mono text-xs text-gray-500">— {camera.site}</span>
          </div>
          <button onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-gray-400 transition hover:bg-white/10">
            ESC / Fermer
          </button>
        </div>
        <div className="imou-player-card w-full overflow-hidden rounded-xl border border-cyan-500/20 bg-black"
          style={{ aspectRatio: "16/9" }}>
          <ImouPlayer camera={camera} />
        </div>
        <p className="mt-3 text-center font-mono text-xs text-white/20">
          Double-clic ou ESC pour fermer
        </p>
      </div>
    </div>
  );
}

// ─── Camera Card ──────────────────────────────────────────────────────────────
function CameraCard({ camera, isSelected, onCardClick, liveSlots, setLiveSlots, snapshot, autoPlay }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [fsOpen, setFsOpen]       = useState(false);
  const [waking, setWaking]       = useState(false);

  const isOnline = camera.status === "online";
  const isSleep  = camera.status === "sleep";
  const isOff    = !isOnline && !isSleep;
  const canAttemptPlay = isOnline || isSleep;

  // Lancement automatique si autoPlay
  useEffect(() => {
    if (autoPlay && isOnline && !isPlaying) {
      setLiveSlots((prev) => {
        if (prev.includes(camera.id) || prev.length >= MAX_LIVE_SLOTS) return prev;
        return [...prev, camera.id];
      });
      setIsPlaying(true);
    }
  }, [autoPlay]);

  // Éviction si slots pleins
  useEffect(() => {
    if (isPlaying && !liveSlots.includes(camera.id)) {
      setIsPlaying(false);
    }
  }, [liveSlots]);

  const handlePlay = (e) => {
    e.stopPropagation();
    if (!canAttemptPlay) return;

    if (isPlaying) {
      setIsPlaying(false);
      setLiveSlots((prev) => prev.filter((id) => id !== camera.id));
      return;
    }

    if (liveSlots.length >= MAX_LIVE_SLOTS) {
      const evicted = liveSlots[0];
      setLiveSlots((prev) => [...prev.slice(1), camera.id]);
    } else {
      setLiveSlots((prev) => [...prev, camera.id]);
    }

    if (isSleep) setWaking(true);
    setIsPlaying(true);
  };

  const getStatusBadge = () => {
    if (isOnline) return <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">EN LIGNE</span>;
    if (isSleep)  return <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">VEILLE</span>;
    return               <span className="shrink-0 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">HORS LIGNE</span>;
  };

  return (
    <>
      {fsOpen && <CameraFullscreen camera={camera} onClose={() => setFsOpen(false)} />}

      <div
        onClick={() => !isOff && onCardClick(camera)}
        onDoubleClick={() => isPlaying && setFsOpen(true)}
        className={`group overflow-hidden rounded-xl border bg-gray-900 transition
          ${isOff ? "opacity-60" : "cursor-pointer hover:scale-[1.01]"}
          ${isSelected ? "border-cyan-500/40 ring-1 ring-cyan-500/20" : "border-gray-800 hover:border-cyan-500/30"}`}
      >
        <div className="flex items-start justify-between gap-3 p-2 pb-1">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-white">{camera.name}</h3>
            <p className="text-sm text-gray-400">{camera.site}</p>
          </div>
          {getStatusBadge()}
        </div>

        <div className="relative mx-2 mb-2 overflow-hidden rounded-xl bg-black" style={{ height: "176px" }}>
          {isPlaying && (
            <div className="imou-player-card absolute inset-0">
              <ImouPlayer camera={camera} onError={() => setWaking(false)} />
            </div>
          )}

          {!isPlaying && snapshot?.thumbUrl && (
            <>
              <img
                src={snapshot.thumbUrl}
                alt={camera.name}
                className="h-full w-full object-cover opacity-60"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              {snapshot.localDate && (
                <div className="absolute bottom-2 left-2">
                  <span className="rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] text-gray-400">
                    {snapshot.localDate}
                  </span>
                </div>
              )}
            </>
          )}

          {!isPlaying && !snapshot?.thumbUrl && (
            <div className="flex h-full w-full items-center justify-center">
              {isOff
                ? <p className="text-sm text-gray-600">Hors ligne</p>
                : <p className="text-sm text-gray-600">{isSleep ? "En veille" : "Cliquer ▶ pour lancer"}</p>
              }
            </div>
          )}

          {canAttemptPlay && (
            <button
              onClick={handlePlay}
              className={`absolute right-2 top-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition
                ${isPlaying
                  ? "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
                  : "bg-black/60 border border-white/10 text-white hover:bg-black/80 opacity-0 group-hover:opacity-100"
                }`}
            >
              {isPlaying ? (
                <><svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>Stop</>
              ) : (
                <><svg className="h-3 w-3" style={{ transform: "translateX(1px)" }} fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>{isSleep ? "Réveiller" : "Live"}</>
              )}
            </button>
          )}

          {waking && isPlaying && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded bg-amber-500/20 px-2 py-0.5">
              <svg className="h-3 w-3 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
              </svg>
              <span className="font-mono text-[10px] text-amber-400">Réveil...</span>
            </div>
          )}

          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
              <span className="rounded bg-black/50 px-2 py-1 font-mono text-xs text-cyan-400/80">⤢ double-clic</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Site Card ────────────────────────────────────────────────────────────────
function SiteCard({ site, onClick }) {
  const online  = site.cameras.filter((c) => c.status === "online").length;
  const sleep   = site.cameras.filter((c) => c.status === "sleep").length;
  const offline = site.cameras.filter((c) => c.status === "offline").length;
  const total   = site.cameras.length;
  const healthPct = total > 0 ? Math.round((online / total) * 100) : 0;

  const healthColor = healthPct >= 70 ? "bg-emerald-500" : healthPct >= 40 ? "bg-amber-500" : "bg-red-500";
  const borderColor = healthPct >= 70 ? "border-emerald-500/20 hover:border-emerald-500/40" : healthPct >= 40 ? "border-amber-500/20 hover:border-amber-500/40" : "border-red-500/20 hover:border-red-500/40";

  return (
    <div
      onClick={() => onClick(site)}
      className={`cursor-pointer overflow-hidden rounded-xl border bg-gray-900 p-5 transition hover:scale-[1.01] hover:shadow-lg hover:shadow-black/30 ${borderColor}`}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{site.name}</h3>
          <p className="text-sm text-gray-500">{total} caméra{total > 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-800 px-3 py-1">
          <span className={`h-2 w-2 rounded-full ${online > 0 ? "bg-emerald-400 animate-pulse" : "bg-gray-600"}`} />
          <span className="text-xs font-medium text-gray-300">{online} en ligne</span>
        </div>
      </div>

      {/* Barre de santé */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-gray-500">Disponibilité</span>
          <span className="text-xs font-medium text-gray-300">{healthPct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-800">
          <div className={`h-full rounded-full transition-all ${healthColor}`} style={{ width: `${healthPct}%` }} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-center">
          <p className="text-lg font-bold text-emerald-400">{online}</p>
          <p className="text-[10px] text-gray-500">En ligne</p>
        </div>
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-center">
          <p className="text-lg font-bold text-amber-400">{sleep}</p>
          <p className="text-[10px] text-gray-500">Veille</p>
        </div>
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-center">
          <p className="text-lg font-bold text-red-400">{offline}</p>
          <p className="text-[10px] text-gray-500">Hors ligne</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-end">
        <span className="flex items-center gap-1 text-xs text-gray-500 hover:text-cyan-400 transition">
          Voir les caméras
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </div>
  );
}

// ─── Hook snapshots ───────────────────────────────────────────────────────────
function useLastSnapshots(cameras) {
  const [snapshots, setSnapshots] = useState({});
  const fetchedRef = useRef(new Set());

  useEffect(() => {
    cameras
      .filter((c) => c.status !== "online" && c.deviceId)
      .forEach(async (camera) => {
        if (fetchedRef.current.has(camera.deviceId)) return;
        fetchedRef.current.add(camera.deviceId);
        try {
          const data = await fetchAlerts(camera.deviceId, camera.channelId ?? 0);
          const alarms = data?.alarms || [];
          if (alarms.length > 0) {
            const latest = alarms[0];
            setSnapshots((prev) => ({
              ...prev,
              [camera.deviceId]: {
                thumbUrl:  proxyImageUrl(latest.thumbUrl || latest.picurlArray?.[0] || null),
                localDate: latest.raw?.localDate || null,
              },
            }));
          }
        } catch {}
      });
  }, [cameras]);

  useEffect(() => {
    cameras.filter((c) => c.status === "online").forEach((c) => fetchedRef.current.delete(c.deviceId));
  }, [cameras]);

  return snapshots;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard({ sites, selectedSite, setSelectedSite, selectedCamera, setSelectedCamera, setCurrentPage }) {
  const allCameras  = sites.flatMap((s) => s.cameras);
  const currentSite = selectedSite ? sites.find((s) => s.id === selectedSite) || null : null;
  const visibleCameras = currentSite ? currentSite.cameras : [];

  const sorted = currentSite ? [
    ...visibleCameras.filter((c) => c.status === "online"),
    ...visibleCameras.filter((c) => c.status === "sleep"),
    ...visibleCameras.filter((c) => c.status === "offline"),
  ] : [];

  const total   = allCameras.length;
  const online  = allCameras.filter((c) => c.status === "online").length;
  const sleep   = allCameras.filter((c) => c.status === "sleep").length;
  const offline = allCameras.filter((c) => c.status === "offline").length;

  const [liveSlots, setLiveSlots] = useState([]);

  // Reset slots quand on change de site
  useEffect(() => {
    setLiveSlots([]);
  }, [selectedSite]);

  const snapshots = useLastSnapshots(visibleCameras);

  // Les 4 premières caméras online ont l'autoPlay
  const onlineCameraIds = sorted.filter((c) => c.status === "online").slice(0, MAX_LIVE_SLOTS).map((c) => c.id);

  const handleCardClick = (camera) => {
    setSelectedCamera(camera);
    setCurrentPage("cameraView");
  };

  const handleSiteClick = (site) => {
    setSelectedSite(site.id);
  };

  return (
    <div className="animate-fadeIn p-6">

      {/* Stats globales */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          {currentSite ? currentSite.name : "Centre de supervision"}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {currentSite
            ? `${visibleCameras.length} caméra${visibleCameras.length > 1 ? "s" : ""} · ${visibleCameras.filter(c => c.status === "online").length} en ligne`
            : `${sites.length} sites · ${total} caméras au total`}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="absolute right-4 top-4 rounded-lg bg-gray-700/40 p-2">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <p className="text-xs font-medium uppercase tracking-widest text-gray-500">Total caméras</p>
          <h3 className="mt-2 text-4xl font-bold text-white">{total}</h3>
          <p className="mt-1 text-xs text-gray-600">{sites.length} site{sites.length > 1 ? "s" : ""}</p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gray-900 p-5">
          <div className="absolute right-4 top-4 rounded-lg bg-emerald-500/10 p-2">
            <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs font-medium uppercase tracking-widest text-gray-500">En ligne</p>
          <h3 className="mt-2 text-4xl font-bold text-emerald-400">{online}</h3>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-800">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: total > 0 ? `${(online / total) * 100}%` : "0%" }} />
            </div>
            <span className="text-xs text-gray-600">{total > 0 ? Math.round((online / total) * 100) : 0}%</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-red-500/20 bg-gray-900 p-5">
          <div className="absolute right-4 top-4 rounded-lg bg-red-500/10 p-2">
            <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-xs font-medium uppercase tracking-widest text-gray-500">Hors ligne</p>
          <h3 className="mt-2 text-4xl font-bold text-red-400">{offline}</h3>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-800">
              <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: total > 0 ? `${(offline / total) * 100}%` : "0%" }} />
            </div>
            <span className="text-xs text-gray-600">{total > 0 ? Math.round((offline / total) * 100) : 0}%</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gray-900 p-5">
          <div className="absolute right-4 top-4 rounded-lg bg-amber-500/10 p-2">
            <svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <p className="text-xs font-medium uppercase tracking-widest text-gray-500">En veille</p>
          <h3 className="mt-2 text-4xl font-bold text-amber-400">{sleep}</h3>
          <p className="mt-1 text-xs text-gray-600">{sites.length} site{sites.length > 1 ? "s" : ""} actifs</p>
        </div>
      </div>

      {/* Vue sites (pas de site sélectionné) */}
      {!currentSite && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Sites de surveillance</h2>
              <p className="mt-1 text-sm text-gray-400">Sélectionnez un site pour voir ses caméras</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
            {sites.map((site) => (
              <SiteCard key={site.id} site={site} onClick={handleSiteClick} />
            ))}
          </div>
        </>
      )}

      {/* Vue caméras d'un site */}
      {currentSite && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedSite(null)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-cyan-400 transition"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Tous les sites
                </button>
                <span className="text-gray-700">/</span>
                <h2 className="text-xl font-semibold text-white">{currentSite.name}</h2>
              </div>
              <p className="mt-1 text-sm text-gray-400">
                {liveSlots.length > 0
                  ? `${liveSlots.length}/${MAX_LIVE_SLOTS} flux live actif${liveSlots.length > 1 ? "s" : ""}`
                  : "Les caméras en ligne démarrent automatiquement"}
              </p>
            </div>
            {liveSlots.length > 0 && (
              <button
                onClick={() => setLiveSlots([])}
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
              >
                Tout arrêter
              </button>
            )}
          </div>

          {sorted.length === 0 ? (
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center text-gray-400">
              Aucune caméra disponible pour ce site.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sorted.map((camera) => (
                <CameraCard
                  key={camera.id}
                  camera={camera}
                  isSelected={selectedCamera?.id === camera.id}
                  onCardClick={handleCardClick}
                  liveSlots={liveSlots}
                  setLiveSlots={setLiveSlots}
                  snapshot={snapshots[camera.deviceId] || null}
                  autoPlay={onlineCameraIds.includes(camera.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}