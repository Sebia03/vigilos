import { useState, useMemo } from "react";
import ImouPlayer from "../components/ImouPlayer";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDateTimeLocal(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toImouFormat(dateTimeLocal) {
  // "2026-06-05T14:30" → "2026-06-05 14:30:00"
  return dateTimeLocal.replace("T", " ") + ":00";
}

function addMinutes(dateTimeLocal, minutes) {
  const d = new Date(dateTimeLocal);
  d.setMinutes(d.getMinutes() + minutes);
  return formatDateTimeLocal(d);
}

const DURATIONS = [
  { label: "5 min",  value: 5 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1h",     value: 60 },
  { label: "2h",     value: 120 },
];

// ─── Playback Page ────────────────────────────────────────────────────────────
export default function Playback({ sites, selectedCamera, setSelectedCamera }) {
  const now     = new Date();
  const oneHAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [mode, setMode]           = useState("duration"); // "duration" | "range"
  const [selectedCam, setSelectedCam] = useState(selectedCamera || null);
  const [beginTime, setBeginTime] = useState(formatDateTimeLocal(oneHAgo));
  const [endTime, setEndTime]     = useState(formatDateTimeLocal(now));
  const [duration, setDuration]   = useState(30);
  const [playing, setPlaying]     = useState(false);
  const [playbackTime, setPlaybackTime] = useState(null);

  const allCameras = useMemo(() => sites?.flatMap((s) => s.cameras) || [], [sites]);

  const handlePlay = () => {
    if (!selectedCam) return;

    let begin, end;
    if (mode === "duration") {
      begin = toImouFormat(beginTime);
      end   = toImouFormat(addMinutes(beginTime, duration));
    } else {
      begin = toImouFormat(beginTime);
      end   = toImouFormat(endTime);
    }

    setPlaybackTime({ beginTime: begin, endTime: end });
    setPlaying(true);
  };

  const handleStop = () => {
    setPlaying(false);
    setPlaybackTime(null);
  };

  const handleCameraSelect = (cam) => {
    setSelectedCam(cam);
    setPlaying(false);
    setPlaybackTime(null);
    if (setSelectedCamera) setSelectedCamera(cam);
  };

  return (
    <div className="animate-fadeIn p-6">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Playback</h1>
        <p className="mt-1 text-sm text-gray-400">Rejouer une séquence vidéo sur une période choisie</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ── Panneau de contrôle ────────────────────────────────────────── */}
        <div className="space-y-4 xl:col-span-1">

          {/* Sélection caméra */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">Caméra</h2>
            <select
              value={selectedCam?.deviceId || ""}
              onChange={(e) => {
                const cam = allCameras.find((c) => c.deviceId === e.target.value);
                if (cam) handleCameraSelect(cam);
              }}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-cyan-500/50"
            >
              <option value="">-- Sélectionner une caméra --</option>
              {sites?.map((site) => (
                <optgroup key={site.id} label={site.name}>
                  {site.cameras.map((cam) => (
                    <option key={cam.deviceId} value={cam.deviceId}>
                      {cam.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Mode de sélection */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">Mode</h2>
            <div className="flex gap-2">
              <button onClick={() => { setMode("duration"); setPlaying(false); }}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
                  mode === "duration"
                    ? "border border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                    : "border border-gray-700 text-gray-400 hover:bg-gray-800"
                }`}>
                Durée
              </button>
              <button onClick={() => { setMode("range"); setPlaying(false); }}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
                  mode === "range"
                    ? "border border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                    : "border border-gray-700 text-gray-400 hover:bg-gray-800"
                }`}>
                Plage horaire
              </button>
            </div>
          </div>

          {/* Contrôles selon le mode */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-white">
              {mode === "duration" ? "Date & durée" : "Plage horaire"}
            </h2>

            {/* Date/heure de début — commun aux deux modes */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500 uppercase tracking-widest">
                {mode === "duration" ? "Début" : "De"}
              </label>
              <input
                type="datetime-local"
                value={beginTime}
                onChange={(e) => { setBeginTime(e.target.value); setPlaying(false); }}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Mode durée */}
            {mode === "duration" && (
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 uppercase tracking-widest">Durée</label>
                <div className="flex flex-wrap gap-2">
                  {DURATIONS.map((d) => (
                    <button key={d.value} onClick={() => { setDuration(d.value); setPlaying(false); }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        duration === d.value
                          ? "border border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                          : "border border-gray-700 text-gray-400 hover:bg-gray-800"
                      }`}>
                      {d.label}
                    </button>
                  ))}
                </div>
                {beginTime && (
                  <p className="text-xs text-gray-600 font-mono">
                    Fin : {toImouFormat(addMinutes(beginTime, duration))}
                  </p>
                )}
              </div>
            )}

            {/* Mode plage horaire */}
            {mode === "range" && (
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 uppercase tracking-widest">À</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => { setEndTime(e.target.value); setPlaying(false); }}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-cyan-500/50"
                />
              </div>
            )}
          </div>

          {/* Boutons action */}
          <div className="flex gap-2">
            <button
              onClick={handlePlay}
              disabled={!selectedCam}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 py-3 text-sm font-semibold text-cyan-400 transition hover:bg-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Lancer
            </button>
            {playing && (
              <button onClick={handleStop}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
                Stop
              </button>
            )}
          </div>

          {/* Infos caméra sélectionnée */}
          {selectedCam && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Caméra sélectionnée</p>
              <p className="text-sm font-medium text-white">{selectedCam.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{selectedCam.site}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${
                  selectedCam.status === "online" ? "bg-emerald-400" :
                  selectedCam.status === "sleep"  ? "bg-amber-400" : "bg-red-400"
                }`} />
                <span className="text-xs text-gray-500 capitalize">{selectedCam.status}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Player ────────────────────────────────────────────────────── */}
        <div className="xl:col-span-2">
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-3 shadow-lg">
            <div className="overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16/9" }}>
              {playing && selectedCam && playbackTime ? (
                <ImouPlayer camera={selectedCam} playbackTime={playbackTime} />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                  <svg className="h-12 w-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                      d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                  </svg>
                  <p className="text-sm text-gray-600">
                    {!selectedCam
                      ? "Sélectionnez une caméra"
                      : "Configurez la période et cliquez sur Lancer"}
                  </p>
                </div>
              )}
            </div>

            {/* Info playback actif */}
            {playing && playbackTime && (
              <div className="mt-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                  <span className="text-xs font-medium text-cyan-400">Playback en cours</span>
                </div>
                <p className="text-xs text-gray-600 font-mono">
                  {playbackTime.beginTime} → {playbackTime.endTime}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}