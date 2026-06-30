import { useEffect, useRef, useState, useCallback } from "react";
import ImouPlayer from "../components/ImouPlayer";
import { fetchAlerts } from "../services/ImouService";

const BASE_URL = "/api";
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
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black" onDoubleClick={onClose}>
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
        <div className="imou-player-card w-full overflow-hidden rounded-xl border border-cyan-500/20 bg-black" style={{ aspectRatio: "16/9" }}>
          <ImouPlayer camera={camera} />
        </div>
        <p className="mt-3 text-center font-mono text-xs text-white/20">Double-clic ou ESC pour fermer</p>
      </div>
    </div>
  );
}

// ─── Camera Card ──────────────────────────────────────────────────────────────
// isPlaying est maintenant entièrement piloté par liveSlots (via IntersectionObserver dans le parent)
function CameraCard({ camera, isSelected, onCardClick, liveSlots, snapshot, registerRef }) {
  const [fsOpen, setFsOpen] = useState(false);
  const [waking, setWaking] = useState(false);
  const cardRef = useRef(null);

  const isOnline = camera.status === "online";
  const isSleep  = camera.status === "sleep";
  const isOff    = !isOnline && !isSleep;
  const isPlaying = liveSlots.includes(camera.id);

  // Enregistrer la ref auprès du parent pour l'IntersectionObserver
  useEffect(() => {
    if (cardRef.current) registerRef(camera.id, cardRef.current);
    return () => registerRef(camera.id, null);
  }, [camera.id, registerRef]);

  useEffect(() => {
    if (isPlaying && isSleep) setWaking(true);
    if (!isPlaying) setWaking(false);
  }, [isPlaying, isSleep]);

  const getStatusBadge = () => {
    if (isOnline) return <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">EN LIGNE</span>;
    if (isSleep)  return <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">VEILLE</span>;
    return               <span className="shrink-0 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">HORS LIGNE</span>;
  };

  return (
    <>
      {fsOpen && <CameraFullscreen camera={camera} onClose={() => setFsOpen(false)} />}

      <div
        ref={cardRef}
        data-camera-id={camera.id}
        data-online={isOnline ? "1" : "0"}
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
              <img src={snapshot.thumbUrl} alt={camera.name}
                className="h-full w-full object-cover opacity-60"
                onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              {snapshot.localDate && (
                <div className="absolute bottom-2 left-2">
                  <span className="rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] text-gray-400">{snapshot.localDate}</span>
                </div>
              )}
            </>
          )}

          {!isPlaying && !snapshot?.thumbUrl && (
            <div className="flex h-full w-full items-center justify-center">
              {isOff
                ? <p className="text-sm text-gray-600">Hors ligne</p>
                : <p className="text-sm text-gray-600">Chargement à l'écran...</p>
              }
            </div>
          )}

          {/* Badge live discret, pas de bouton manuel */}
          {isPlaying && (
            <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded-lg bg-black/60 border border-white/10 px-2.5 py-1.5 text-xs font-medium text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
              LIVE
            </div>
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
  const healthPct   = total > 0 ? Math.round((online / total) * 100) : 0;
  const healthColor = healthPct >= 70 ? "bg-emerald-500" : healthPct >= 40 ? "bg-amber-500" : "bg-red-500";
  const borderColor = healthPct >= 70 ? "border-emerald-500/20 hover:border-emerald-500/40" : healthPct >= 40 ? "border-amber-500/20 hover:border-amber-500/40" : "border-red-500/20 hover:border-red-500/40";

  return (
    <div onClick={() => onClick(site)}
      className={`cursor-pointer overflow-hidden rounded-xl border bg-gray-900 p-5 transition hover:scale-[1.01] hover:shadow-lg hover:shadow-black/30 ${borderColor}`}>
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
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-gray-500">Disponibilité</span>
          <span className="text-xs font-medium text-gray-300">{healthPct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-800">
          <div className={`h-full rounded-full transition-all ${healthColor}`} style={{ width: `${healthPct}%` }} />
        </div>
      </div>
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
    cameras.filter((c) => c.status !== "online" && c.deviceId).forEach(async (camera) => {
      if (fetchedRef.current.has(camera.deviceId)) return;
      fetchedRef.current.add(camera.deviceId);
      try {
        const data   = await fetchAlerts(camera.deviceId, camera.channelId ?? 0);
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

// ─── Hook IntersectionObserver pour autoplay au scroll ───────────────────────
function useScrollAutoplay(cameras, containerSelector = null) {
  const [liveSlots, setLiveSlots] = useState([]);
  const elementsRef   = useRef(new Map());   // cameraId -> DOM element
  const visibleRef    = useRef(new Map());   // cameraId -> intersectionRatio
  const observerRef   = useRef(null);

  const registerRef = useCallback((cameraId, el) => {
    if (el) {
      elementsRef.current.set(cameraId, el);
      if (observerRef.current) observerRef.current.observe(el);
    } else {
      const old = elementsRef.current.get(cameraId);
      if (old && observerRef.current) observerRef.current.unobserve(old);
      elementsRef.current.delete(cameraId);
      visibleRef.current.delete(cameraId);
    }
  }, []);

  const recompute = useCallback(() => {
    // Trier les caméras visibles par ratio de visibilité décroissant,
    // puis par position dans la liste (ordre DOM) en cas d'égalité.
    const onlineIds = new Set(cameras.filter((c) => c.status === "online").map((c) => c.id));

    const visibleEntries = Array.from(visibleRef.current.entries())
      .filter(([id, ratio]) => ratio > 0.4 && onlineIds.has(id));

    // Ordonner par position verticale (top) pour un comportement naturel de scroll
    visibleEntries.sort((a, b) => {
      const elA = elementsRef.current.get(a[0]);
      const elB = elementsRef.current.get(b[0]);
      if (!elA || !elB) return 0;
      return elA.getBoundingClientRect().top - elB.getBoundingClientRect().top;
    });

    const newSlots = visibleEntries.slice(0, MAX_LIVE_SLOTS).map(([id]) => id);
    setLiveSlots((prev) => {
      const sameLength = prev.length === newSlots.length;
      const sameContent = sameLength && prev.every((id, i) => id === newSlots[i]);
      return sameContent ? prev : newSlots;
    });
  }, [cameras]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("data-camera-id");
          if (id) visibleRef.current.set(id, entry.intersectionRatio);
        });
        recompute();
      },
      { threshold: [0, 0.4, 0.6, 1] }
    );

    // Observer tous les éléments déjà enregistrés
    elementsRef.current.forEach((el) => observerRef.current.observe(el));

    return () => observerRef.current?.disconnect();
  }, [recompute]);

  // Recalcule au montage / changement de liste (ex: changement de site)
  useEffect(() => {
    visibleRef.current.clear();
    setLiveSlots([]);
  }, [cameras.map((c) => c.id).join(",")]);

  return { liveSlots, registerRef };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard({ sites, selectedSite, setSelectedSite, selectedCamera, setSelectedCamera, setCurrentPage }) {
  const allCameras     = sites.flatMap((s) => s.cameras);
  const currentSite    = selectedSite ? sites.find((s) => s.id === selectedSite) || null : null;
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

  const { liveSlots, registerRef } = useScrollAutoplay(sorted);
  const snapshots = useLastSnapshots(visibleCameras);

  const handleCardClick = (camera) => { setSelectedCamera(camera); setCurrentPage("cameraView"); };
  const handleSiteClick = (site)   => { setSelectedSite(site.id); };

  return (
    <div className="animate-fadeIn p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{currentSite ? currentSite.name : "Centre de supervision"}</h1>
        <p className="mt-1 text-sm text-gray-400">
          {currentSite
            ? `${visibleCameras.length} caméra${visibleCameras.length > 1 ? "s" : ""} · ${visibleCameras.filter(c => c.status === "online").length} en ligne`
            : `${sites.length} sites · ${total} caméras au total`}
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

      {/* Vue sites */}
      {!currentSite && (
        <>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white">Sites de surveillance</h2>
            <p className="mt-1 text-sm text-gray-400">Sélectionnez un site pour voir ses caméras</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
            {sites.map((site) => <SiteCard key={site.id} site={site} onClick={handleSiteClick} />)}
          </div>
        </>
      )}

      {/* Vue caméras */}
      {currentSite && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedSite(null)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-cyan-400 transition">
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
                  ? `${liveSlots.length}/${MAX_LIVE_SLOTS} flux live actif${liveSlots.length > 1 ? "s" : ""} · les flux suivent votre défilement`
                  : "Faites défiler pour démarrer les flux automatiquement"}
              </p>
            </div>
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
                  snapshot={snapshots[camera.deviceId] || null}
                  registerRef={registerRef}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}