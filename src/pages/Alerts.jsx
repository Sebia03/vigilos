import { useEffect, useMemo, useState } from "react";
import { fetchAlerts } from "../services/ImouService";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:5000";

async function fetchImageAsDataUrl(url) {
  if (!url) return null;
  try {
    const res = await axios.get(`${BASE_URL}/image-proxy`, {
      params: { url },
    });
    console.log("IMAGE PROXY response:", res.data);  // cette ligne doit être là
    return res.data?.dataUrl || null;
  } catch (e) {
    console.log("IMAGE PROXY erreur:", e.message);
    return null;
  }
}

function getRawImageUrl(alert) {
  return alert.thumbUrl || alert.picurlArray?.[0] || null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  human_detection:  { label: "Détection humaine",    color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/20",    dot: "bg-cyan-400" },
  motion_detection: { label: "Mouvement détecté",    color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   dot: "bg-amber-400" },
  human_infrared:   { label: "Infrarouge humain",    color: "text-purple-400",  bg: "bg-purple-500/10",  border: "border-purple-500/20",  dot: "bg-purple-400" },
  low_voltage:      { label: "Batterie faible",       color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",     dot: "bg-red-400" },
  unknown:          { label: "Alerte",                color: "text-gray-400",    bg: "bg-gray-500/10",    border: "border-gray-700",        dot: "bg-gray-400" },
};

function getAlertType(alert) {
  if (alert.msgType === "human"       || alert.labelType === "humanAlarm"   || alert.typeLabel === "human_detection")  return "human_detection";
  if (alert.msgType === "videoMotion" || alert.labelType === "motionAlarm"  || alert.typeLabel === "motion_detection") return "motion_detection";
  if (alert.typeLabel === "human_infrared") return "human_infrared";
  if (alert.typeLabel === "low_voltage_alarm") return "low_voltage";
  return "unknown";
}

function getAlertConfig(alert) {
  return TYPE_CONFIG[getAlertType(alert)] || TYPE_CONFIG.unknown;
}

function getAlertImage(alert) {
  return getRawImageUrl(alert);
}

function formatDate(dateStr) {
  if (!dateStr) return "Date inconnue";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── Alert Card ───────────────────────────────────────────────────────────────
function AlertCard({ alert }) {
  const cfg         = getAlertConfig(alert);
  const rawImageUrl = getAlertImage(alert);
  const dateStr     = alert.raw?.localDate || alert.localDate || null;
  const [dataUrl, setDataUrl]   = useState(null);
  const [imgLoading, setImgLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!rawImageUrl) { setImgLoading(false); return; }
    setImgLoading(true);
    fetchImageAsDataUrl(rawImageUrl).then((url) => {
      if (!cancelled) {
        setDataUrl(url);
        setImgLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [rawImageUrl]);

  return (
    <div className={`overflow-hidden rounded-xl border bg-gray-900 transition hover:scale-[1.01] hover:shadow-lg hover:shadow-black/30 ${cfg.border}`}>
      {/* Image */}
      <div className="relative h-44 w-full bg-gray-800">
        {imgLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-6 w-6 animate-spin text-gray-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
          </div>
        ) : dataUrl ? (
          <>
            <img
              src={dataUrl}
              alt={cfg.label}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="mt-2 text-xs text-gray-600">Image indisponible</p>
            </div>
          </div>
        )}

        {/* Badge type en haut à gauche */}
        <div className={`absolute left-2 top-2 flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${cfg.bg} ${cfg.border}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          <span className={`text-[11px] font-medium ${cfg.color}`}>{cfg.label}</span>
        </div>
      </div>

      {/* Infos */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-white">{cfg.label}</p>
            {dateStr && (
              <p className="mt-0.5 text-xs text-gray-500">
                {formatDate(dateStr)}
                <span className="mx-1 text-gray-700">·</span>
                <span className="font-mono">{formatTime(dateStr)}</span>
              </p>
            )}
          </div>
          {alert.raw?.channelId !== undefined && (
            <span className="shrink-0 rounded bg-gray-800 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">
              Canal {alert.raw.channelId}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Alerts Page ──────────────────────────────────────────────────────────────
export default function Alerts({ selectedCamera = null, selectedSite = null }) {
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState("all");

  const deviceId   = selectedCamera?.deviceId || selectedCamera?.id;
  const cameraName = selectedCamera?.name || "Caméra";
  const channelId  = selectedCamera?.channelId ?? 0;

  useEffect(() => {
    if (!deviceId) { setAlerts([]); setLoading(false); setError(null); return; }
    loadAlerts();
    const interval = setInterval(loadAlerts, 15000);
    return () => clearInterval(interval);
  }, [deviceId, channelId]);

  const loadAlerts = async () => {
    if (!deviceId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAlerts(deviceId, channelId);
      const raw  = data?.success ? data.alarms || [] : [];
      const sorted = [...raw].sort((a, b) => {
        const da = new Date(a.raw?.localDate || 0).getTime();
        const db = new Date(b.raw?.localDate || 0).getTime();
        return db - da;
      });
      setAlerts(sorted);
    } catch (err) {
      console.error("Erreur chargement alertes:", err);
      setError("Impossible de charger les alertes");
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  // Comptages par type
  const counts = useMemo(() => {
    const c = { human_detection: 0, motion_detection: 0, human_infrared: 0, low_voltage: 0, unknown: 0 };
    alerts.forEach((a) => { const t = getAlertType(a); c[t] = (c[t] || 0) + 1; });
    return c;
  }, [alerts]);

  // Alertes filtrées
  const filtered = useMemo(() => {
    if (filter === "all") return alerts;
    return alerts.filter((a) => getAlertType(a) === filter);
  }, [alerts, filter]);

  // Types présents
  const presentTypes = useMemo(() => {
    return Object.entries(counts).filter(([, v]) => v > 0).map(([k]) => k);
  }, [counts]);

  // ── Pas de caméra sélectionnée ────────────────────────────────────────────
  if (!selectedSite || !selectedCamera) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-800 bg-gray-900">
            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white">Aucune caméra sélectionnée</h2>
          <p className="mt-1 text-sm text-gray-500">Sélectionnez une caméra dans la section Alertes de la sidebar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn p-6">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white truncate max-w-xl">
            Alertes
            <span className="ml-2 text-gray-500">—</span>
            <span className="ml-2 text-lg font-medium text-gray-300">{cameraName}</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500 font-mono">{deviceId}</p>
        </div>

        {/* Bouton refresh */}
        <button
          onClick={loadAlerts}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-800 disabled:opacity-50"
        >
          <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </button>
      </div>

      {/* Stats cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Total */}
        <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="absolute right-4 top-4 rounded-lg bg-gray-700/40 p-2">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <p className="text-xs font-medium uppercase tracking-widest text-gray-500">Total alertes</p>
          <h3 className="mt-2 text-4xl font-bold text-white">{alerts.length}</h3>
          <p className="mt-1 text-xs text-gray-600">Dernières 24h</p>
        </div>

        {/* Humain */}
        <div className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-gray-900 p-5">
          <div className="absolute right-4 top-4 rounded-lg bg-cyan-500/10 p-2">
            <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <p className="text-xs font-medium uppercase tracking-widest text-gray-500">Détection humaine</p>
          <h3 className="mt-2 text-4xl font-bold text-cyan-400">{counts.human_detection + counts.human_infrared}</h3>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-800">
              <div className="h-full rounded-full bg-cyan-500 transition-all"
                style={{ width: alerts.length > 0 ? `${((counts.human_detection + counts.human_infrared) / alerts.length) * 100}%` : "0%" }} />
            </div>
            <span className="text-xs text-gray-600">
              {alerts.length > 0 ? Math.round(((counts.human_detection + counts.human_infrared) / alerts.length) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Mouvement */}
        <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gray-900 p-5">
          <div className="absolute right-4 top-4 rounded-lg bg-amber-500/10 p-2">
            <svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <p className="text-xs font-medium uppercase tracking-widest text-gray-500">Mouvement</p>
          <h3 className="mt-2 text-4xl font-bold text-amber-400">{counts.motion_detection}</h3>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-800">
              <div className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: alerts.length > 0 ? `${(counts.motion_detection / alerts.length) * 100}%` : "0%" }} />
            </div>
            <span className="text-xs text-gray-600">
              {alerts.length > 0 ? Math.round((counts.motion_detection / alerts.length) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Filtres */}
      {presentTypes.length > 1 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === "all"
                ? "bg-gray-700 text-white"
                : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
            }`}
          >
            Tous ({alerts.length})
          </button>
          {presentTypes.map((type) => {
            const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.unknown;
            return (
              <button
                key={type}
                onClick={() => setFilter(filter === type ? "all" : type)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  filter === type
                    ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                    : "border-transparent text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label} ({counts[type]})
              </button>
            );
          })}
        </div>
      )}

      {/* États de chargement / erreur / vide */}
      {loading && alerts.length === 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
              <div className="h-44 w-full bg-gray-800" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-32 rounded bg-gray-800" />
                <div className="h-3 w-24 rounded bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center text-gray-400">
          {filter !== "all"
            ? "Aucune alerte pour ce filtre."
            : "Aucune alerte pour cette caméra."}
        </div>
      )}

      {/* Grille d'alertes */}
      {filtered.length > 0 && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-gray-600">
              {filtered.length} alerte{filtered.length > 1 ? "s" : ""}
              {filter !== "all" && ` · filtre : ${TYPE_CONFIG[filter]?.label}`}
            </p>
            {loading && (
              <p className="flex items-center gap-1.5 text-xs text-gray-600">
                <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
                Actualisation...
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((alert) => (
              <AlertCard key={alert.alarmId} alert={alert} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}