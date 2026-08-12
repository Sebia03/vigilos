import { useState, useEffect } from "react";
import ImouPlayer from "../components/ImouPlayer";

// ─── Slot caméra ──────────────────────────────────────────────────────────────
function CameraSlot({ camera, slotIndex, onRemove, allCameras, onAssign }) {
  const [showPicker, setShowPicker] = useState(false);

  if (!camera) {
    return (
      <div className="relative flex flex-col items-center justify-center w-full h-full bg-gray-950 border-2 border-dashed border-gray-700 rounded-xl overflow-hidden">
        <button onClick={() => setShowPicker(true)}
          className="flex flex-col items-center gap-2 text-gray-600 hover:text-cyan-400 transition">
          <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="text-sm">Ajouter une caméra</span>
        </button>

        {showPicker && (
          <div className="absolute inset-0 z-10 flex flex-col bg-gray-950/95 backdrop-blur-sm p-3 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Choisir une caméra</p>
              <button onClick={() => setShowPicker(false)} className="text-gray-600 hover:text-gray-300">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-1">
              {allCameras.filter(c => c.status === "online").map((cam) => (
                <button key={cam.id} onClick={() => { onAssign(slotIndex, cam); setShowPicker(false); }}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 transition">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="truncate">{cam.name}</span>
                  <span className="text-xs text-gray-600 ml-auto">{cam.site}</span>
                </button>
              ))}
              {allCameras.filter(c => c.status !== "online").map((cam) => (
                <button key={cam.id} onClick={() => { onAssign(slotIndex, cam); setShowPicker(false); }}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-800 transition opacity-60">
                  <span className="h-2 w-2 rounded-full bg-red-400 shrink-0" />
                  <span className="truncate">{cam.name}</span>
                  <span className="text-xs text-gray-600 ml-auto">{cam.site}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const isOnline = camera.status === "online";

  return (
    <div className={`relative group w-full h-full overflow-hidden rounded-xl border-2 transition ${
      "border-gray-800 hover:border-gray-600"
    }`}>

      {/* Player */}
      <div className="absolute inset-0 bg-black">
        {isOnline ? (
          <ImouPlayer camera={camera} />
        ) : (
          <div className="flex h-full items-center justify-center flex-col gap-2">
            <svg className="h-8 w-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            <p className="text-sm text-gray-600">{camera.name}</p>
            <p className="text-xs text-gray-700">Hors ligne</p>
          </div>
        )}
      </div>

      {/* Overlay infos au survol */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition pointer-events-none">
        <p className="text-xs font-medium text-white truncate">{camera.name}</p>
        <p className="text-[10px] text-gray-400">{camera.site}</p>
      </div>

      {/* Badge LIVE */}
      {isOnline && (
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/60 px-2 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[10px] font-mono text-white">LIVE</span>
        </div>
      )}

      {/* Bouton retirer */}
      <button onClick={() => onRemove(slotIndex)}
        className="absolute right-2 top-2 rounded-lg bg-black/60 border border-white/10 p-1.5 text-gray-400 opacity-0 group-hover:opacity-100 transition hover:text-red-400">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Bouton changer */}
      <button onClick={() => setShowPicker(true)}
        className="absolute right-9 top-2 rounded-lg bg-black/60 border border-white/10 p-1.5 text-gray-400 opacity-0 group-hover:opacity-100 transition hover:text-cyan-400">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      </button>

      {/* Picker caméra */}
      {showPicker && (
        <div className="absolute inset-0 z-10 flex flex-col bg-gray-950/95 backdrop-blur-sm p-3 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Changer la caméra</p>
            <button onClick={() => setShowPicker(false)} className="text-gray-600 hover:text-gray-300">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-1">
            {allCameras.filter(c => c.status === "online").map((cam) => (
              <button key={cam.id} onClick={() => { onAssign(slotIndex, cam); setShowPicker(false); }}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 transition">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate">{cam.name}</span>
                <span className="text-xs text-gray-600 ml-auto">{cam.site}</span>
              </button>
            ))}
            {allCameras.filter(c => c.status !== "online").map((cam) => (
              <button key={cam.id} onClick={() => { onAssign(slotIndex, cam); setShowPicker(false); }}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-800 transition opacity-60">
                <span className="h-2 w-2 rounded-full bg-red-400 shrink-0" />
                <span className="truncate">{cam.name}</span>
                <span className="text-xs text-gray-600 ml-auto">{cam.site}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MultiView ────────────────────────────────────────────────────────────────
export default function MultiView({ sites, onClose }) {
  const allCameras    = sites.flatMap((s) => s.cameras);
  const onlineCameras = allCameras.filter((c) => c.status === "online");

  const [slots, setSlots] = useState(() => {
    const initial = [null, null, null, null];
    onlineCameras.slice(0, 4).forEach((cam, i) => { initial[i] = cam; });
    return initial;
  });

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleRemove   = (index) => setSlots((prev) => { const n = [...prev]; n[index] = null; return n; });
  const handleAssign   = (index, camera) => setSlots((prev) => { const n = [...prev]; n[index] = camera; return n; });
  const handleAutoFill = () => {
    const n = [null, null, null, null];
    onlineCameras.slice(0, 4).forEach((cam, i) => { n[i] = cam; });
    setSlots(n);
  };

  return (
    <div className="fixed inset-0 z-[9998] bg-gray-950 flex flex-col" style={{ height: "100dvh" }}>

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-gray-800 px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-sm font-semibold text-white">Mode multi-écran</span>
          </div>
          <span className="text-xs text-gray-600">2×2 · {slots.filter(Boolean).length}/4 flux actifs</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleAutoFill}
            className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-300 transition hover:bg-gray-800">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Auto-remplir
          </button>
          <button onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-300 transition hover:bg-gray-800">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Fermer (ESC)
          </button>
        </div>
      </div>

      {/* Grille 2×2 — prend tout l'espace restant sans déborder */}
      <div className="flex-1 min-h-0 p-3 grid grid-cols-2 grid-rows-2 gap-3">
        {slots.map((camera, index) => (
          <CameraSlot
            key={index}
            camera={camera}
            slotIndex={index}
            allCameras={allCameras}
            onRemove={handleRemove}
            onAssign={handleAssign}
          />
        ))}
      </div>
    </div>
  );
}