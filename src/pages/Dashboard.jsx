import { useEffect, useRef, useState } from "react";
import ImouPlayer from "../components/ImouPlayer";
import { fetchAlerts } from "../services/ImouService";

const BASE_URL = "http://127.0.0.1:5000";
const MAX_LIVE_SLOTS = 2;

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
function CameraCard({ camera, isSelected, onCardClick, liveSlots, setLiveSlots, snapshot }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [fsOpen, setFsOpen]       = useState(false);
  const [waking, setWaking]       = useState(false);

  const isOnline = camera.status === "online";
  const isSleep  = camera.status === "sleep";
  const isOff    = !isOnline && !isSleep;

  const canAttemptPlay = isOnline || isSleep;

  // Si ce player était actif mais on a été évincé (slots pleins), on s'arrête
  useEffect(() => {
    if (isPlaying && !liveSlots.includes(camera.id)) {
      setIsPlaying(false);
    }
  }, [liveSlots]);

  const handlePlay = (e) => {
    e.stopPropagation();
    if (!canAttemptPlay) return;

    if (isPlaying) {
      // Stopper ce player
      setIsPlaying(false);
      setLiveSlots((prev) => prev.filter((id) => id !== camera.id));
      return;
    }

    if (liveSlots.length >= MAX_LIVE_SLOTS) {
      // Évincer le premier slot (le plus ancien)
      const evicted = liveSlots[0];
      setLiveSlots((prev) => [...prev.slice(1), camera.id]);
    } else {
      setLiveSlots((prev) => [...prev, camera.id]);
    }

    if (isSleep) setWaking(true);
    setIsPlaying(true);
  };

  const handlePlayerError = () => {
    setWaking(false);
  };

  const getStatusBadge = () => {
    if (isOnline) return <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">EN LIGNE</span>;
    if (isSleep)  return <span className="shrink-0 rounded-full border border-amber-500/20  bg-amber-500/10  px-3 py-1 text-xs font-medium text-amber-400">VEILLE</span>;
    return               <span className="shrink-0 rounded-full border border-red-500/20    bg-red-500/10    px-3 py-1 text-xs font-medium text-red-400">HORS LIGNE</span>;
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
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-2 pb-1">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-white">{camera.name}</h3>
            <p className="text-sm text-gray-400">{camera.site}</p>
          </div>
          {getStatusBadge()}
        </div>

        {/* Preview zone */}
        <div className="relative mx-2 mb-2 overflow-hidden rounded-xl bg-black" style={{ height: "176px" }}>

          {/* Player IMOU — actif seulement si isPlaying */}
          {isPlaying && (
            <div className="imou-player-card absolute inset-0">
              <ImouPlayer camera={camera} onError={handlePlayerError} />
            </div>
          )}

          {/* Thumbnail snapshot (caméras sleep/offline) */}
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

          {/* Placeholder si pas de snapshot et pas en lecture */}
          {!isPlaying && !snapshot?.thumbUrl && (
            <div className="flex h-full w-full items-center justify-center">
              {isOff ? (
                <p className="text-sm text-gray-600">Hors ligne</p>
              ) : (
                <p className="text-sm text-gray-600">{isSleep ? "En veille" : "Cliquer pour lancer"}</p>
              )}
            </div>
          )}

          {/* Bouton Play/Stop — visible au survol ou quand en lecture */}
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
                <>
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                  Stop
                </>
              ) : (
                <>
                  <svg className="h-3 w-3" style={{ transform: "translateX(1px)" }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  {isSleep ? "Réveiller" : "Live"}
                </>
              )}
            </button>
          )}

          {/* Indicateur "réveil en cours" */}
          {waking && isPlaying && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded bg-amber-500/20 px-2 py-0.5">
              <svg className="h-3 w-3 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
              </svg>
              <span className="font-mono text-[10px] text-amber-400">Réveil...</span>
            </div>
          )}

          {/* Hint double-clic fullscreen */}
          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
              <span className="rounded bg-black/50 px-2 py-1 font-mono text-xs text-cyan-400/80">
                ⤢ double-clic
              </span>
            </div>
          )}
        </div>
      </div>
    </>
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
export default function Dashboard({ sites, selectedSite, selectedCamera, setSelectedCamera, setCurrentPage }) {
  const allCameras  = sites.flatMap((s) => s.cameras);
  const currentSite = selectedSite ? sites.find((s) => s.id === selectedSite) || null : null;
  const visibleCameras = currentSite ? currentSite.cameras : allCameras;

  const sorted = [
    ...visibleCameras.filter((c) => c.status === "online"),
    ...visibleCameras.filter((c) => c.status === "sleep"),
    ...visibleCameras.filter((c) => c.status === "offline"),
  ];

  const total   = visibleCameras.length;
  const online  = visibleCameras.filter((c) => c.status === "online").length;
  const sleep   = visibleCameras.filter((c) => c.status === "sleep").length;
  const offline = visibleCameras.filter((c) => c.status === "offline").length;
  const activeSites = selectedSite
    ? (currentSite?.cameras.length > 0 ? 1 : 0)
    : sites.filter((s) => s.cameras.length > 0).length;

  // Slots live partagés entre toutes les cards
  const [liveSlots, setLiveSlots] = useState([]);

  const snapshots = useLastSnapshots(visibleCameras);

  const handleCardClick = (camera) => {
    setSelectedCamera(camera);
    setCurrentPage("cameraView");
  };

  return (
    <div className="animate-fadeIn p-6">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          {currentSite ? currentSite.name : "Vue d'ensemble"}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {currentSite
            ? `Supervision du site ${currentSite.name}`
            : "Supervision des sites et aperçu rapide des caméras"}
        </p>
      </div>

      {/* Stats */}
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
              <div className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: total > 0 ? `${(online / total) * 100}%` : "0%" }} />
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
              <div className="h-full rounded-full bg-red-500 transition-all"
                style={{ width: total > 0 ? `${(offline / total) * 100}%` : "0%" }} />
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
          <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
            {selectedSite ? "Site affiché" : "Sites actifs"}
          </p>
          <h3 className="mt-2 text-4xl font-bold text-amber-400">{activeSites}</h3>
          {sleep > 0 && <p className="mt-1 text-xs text-amber-500/70">{sleep} en veille</p>}
        </div>
      </div>

      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {currentSite ? `Caméras - ${currentSite.name}` : "Aperçu des caméras"}
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            {sleep > 0 && `${sleep} en veille · `}
            {liveSlots.length > 0
              ? `${liveSlots.length}/${MAX_LIVE_SLOTS} flux live actif${liveSlots.length > 1 ? "s" : ""}`
              : "Cliquer ▶ pour lancer un flux"}
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

      {/* Grid */}
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
            />
          ))}
        </div>
      )}
    </div>
  );
}