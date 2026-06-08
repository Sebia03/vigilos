import { useEffect, useState, useMemo } from "react";
import { fetchAlerts } from "../services/ImouService";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getAlertType(alert) {
  const msgType   = alert.raw?.msgType   || alert.msgType;
  const labelType = alert.raw?.labelType || alert.labelType;
  if (msgType === "human"       || labelType === "humanAlarm")  return "human";
  if (msgType === "videoMotion" || labelType === "motionAlarm") return "motion";
  return "other";
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

const COLORS = {
  human:  "#22d3ee",
  motion: "#fbbf24",
  other:  "#94a3b8",
};

const PIE_COLORS = ["#22d3ee", "#fbbf24", "#94a3b8"];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 p-3 shadow-xl">
      <p className="mb-2 text-xs font-medium text-gray-400">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs" style={{ color: p.color }}>
          {p.name === "human" ? "Humain" : p.name === "motion" ? "Mouvement" : "Autre"} : {p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gray-900 p-5 ${color.border}`}>
      <div className={`absolute right-4 top-4 rounded-lg p-2 ${color.bg}`}>
        {icon}
      </div>
      <p className="text-xs font-medium uppercase tracking-widest text-gray-500">{label}</p>
      <h3 className={`mt-2 text-4xl font-bold ${color.text}`}>{value}</h3>
    </div>
  );
}

// ─── Statistics Page ──────────────────────────────────────────────────────────
export default function Statistics({ sites, currentUser }) {
  const [allAlerts, setAllAlerts]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [progress, setProgress]     = useState({ current: 0, total: 0 });

  // Filtrer les caméras selon le rôle
  const cameras = useMemo(() => {
    const all = sites.flatMap((s) => s.cameras);
    if (currentUser?.role === "admin_site" && currentUser?.site) {
      return all.filter((c) =>
        c.site?.toLowerCase() === currentUser.site.toLowerCase()
      );
    }
    return all;
  }, [sites, currentUser]);

  useEffect(() => {
    if (cameras.length === 0) return;
    loadAllAlerts();
  }, [cameras]);

  const loadAllAlerts = async () => {
    setLoading(true);
    setError(null);
    setAllAlerts([]);
    setProgress({ current: 0, total: cameras.length });

    const results = [];
    for (let i = 0; i < cameras.length; i++) {
      const cam = cameras[i];
      setProgress({ current: i + 1, total: cameras.length });
      try {
        const data = await fetchAlerts(cam.deviceId, cam.channelId ?? 0);
        const alarms = data?.success ? data.alarms || [] : [];
        alarms.forEach((a) => {
          results.push({
            ...a,
            cameraName: cam.name,
            siteName:   cam.site,
            type:       getAlertType(a),
            date:       (a.raw?.localDate || "").split(" ")[0],
          });
        });
      } catch {}
    }

    setAllAlerts(results);
    setLoading(false);
  };

  // ── Stats globales ────────────────────────────────────────────────────────
  const totalAlerts  = allAlerts.length;
  const humanAlerts  = allAlerts.filter((a) => a.type === "human").length;
  const motionAlerts = allAlerts.filter((a) => a.type === "motion").length;
  const otherAlerts  = allAlerts.filter((a) => a.type === "other").length;

  // ── Alertes par jour ──────────────────────────────────────────────────────
  const last7Days = getLast7Days();
  const alertsByDay = last7Days.map((day) => {
    const dayAlerts = allAlerts.filter((a) => a.date === day);
    return {
      date:   formatDateShort(day),
      human:  dayAlerts.filter((a) => a.type === "human").length,
      motion: dayAlerts.filter((a) => a.type === "motion").length,
      other:  dayAlerts.filter((a) => a.type === "other").length,
    };
  });

  // ── Répartition par type (pie) ────────────────────────────────────────────
  const pieData = [
    { name: "Détection humaine", value: humanAlerts },
    { name: "Mouvement",         value: motionAlerts },
    { name: "Autre",             value: otherAlerts },
  ].filter((d) => d.value > 0);

  // ── Alertes par site ──────────────────────────────────────────────────────
  const alertsBySite = useMemo(() => {
    const grouped = {};
    allAlerts.forEach((a) => {
      const site = a.siteName || "Inconnu";
      if (!grouped[site]) grouped[site] = { site, human: 0, motion: 0, other: 0, total: 0 };
      grouped[site][a.type]++;
      grouped[site].total++;
    });
    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [allAlerts]);

  // ── Top caméras ───────────────────────────────────────────────────────────
  const topCameras = useMemo(() => {
    const grouped = {};
    allAlerts.forEach((a) => {
      const name = a.cameraName || "Inconnue";
      if (!grouped[name]) grouped[name] = { name, total: 0, human: 0, motion: 0 };
      grouped[name].total++;
      if (a.type === "human")  grouped[name].human++;
      if (a.type === "motion") grouped[name].motion++;
    });
    return Object.values(grouped).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [allAlerts]);

  return (
    <div className="animate-fadeIn p-6">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Statistiques</h1>
          <p className="mt-1 text-sm text-gray-400">
            Analyse des alertes des 24 dernières heures · {cameras.length} caméra{cameras.length > 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={loadAllAlerts} disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-800 disabled:opacity-50">
          <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mb-6 overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-400">Chargement des alertes...</p>
            <p className="text-sm font-mono text-cyan-400">{progress.current}/{progress.total}</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-800">
            <div className="h-full rounded-full bg-cyan-500 transition-all"
              style={{ width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : "0%" }} />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
      )}

      {!loading && (
        <>
          {/* Stats cards */}
          <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total alertes" value={totalAlerts}
              color={{ border: "border-gray-800", bg: "bg-gray-700/40", text: "text-white" }}
              icon={<svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>}
            />
            <StatCard label="Détection humaine" value={humanAlerts}
              color={{ border: "border-cyan-500/20", bg: "bg-cyan-500/10", text: "text-cyan-400" }}
              icon={<svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>}
            />
            <StatCard label="Mouvement" value={motionAlerts}
              color={{ border: "border-amber-500/20", bg: "bg-amber-500/10", text: "text-amber-400" }}
              icon={<svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>}
            />
            <StatCard label="Autres alertes" value={otherAlerts}
              color={{ border: "border-purple-500/20", bg: "bg-purple-500/10", text: "text-purple-400" }}
              icon={<svg className="h-4 w-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>}
            />
          </div>

          {totalAlerts === 0 ? (
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center text-gray-400">
              Aucune alerte disponible pour la période.
            </div>
          ) : (
            <>
              {/* Graphique alertes par jour */}
              <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-5">
                <h2 className="mb-4 text-base font-semibold text-white">Alertes par jour — 7 derniers jours</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={alertsByDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="human"  stackId="a" fill="#22d3ee" radius={[0,0,0,0]} />
                    <Bar dataKey="motion" stackId="a" fill="#fbbf24" radius={[0,0,0,0]} />
                    <Bar dataKey="other"  stackId="a" fill="#94a3b8" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 flex items-center justify-center gap-4">
                  {[["Humain", "#22d3ee"], ["Mouvement", "#fbbf24"], ["Autre", "#94a3b8"]].map(([label, color]) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
                      <span className="text-xs text-gray-500">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                {/* Pie chart répartition */}
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                  <h2 className="mb-4 text-base font-semibold text-white">Répartition par type</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                        paddingAngle={3} dataKey="value">
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                      <Legend formatter={(value) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Alertes par site */}
                {currentUser?.role === "superadmin" && alertsBySite.length > 0 && (
                  <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                    <h2 className="mb-4 text-base font-semibold text-white">Alertes par site</h2>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={alertsBySite} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                        <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="site" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} width={60} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="human"  stackId="a" fill="#22d3ee" />
                        <Bar dataKey="motion" stackId="a" fill="#fbbf24" />
                        <Bar dataKey="other"  stackId="a" fill="#94a3b8" radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Top 5 caméras */}
              {topCameras.length > 0 && (
                <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
                  <div className="border-b border-gray-800 px-5 py-4">
                    <h2 className="text-base font-semibold text-white">Top 5 caméras les plus actives</h2>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-900/50">
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-gray-500">#</th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-gray-500">Caméra</th>
                        <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-widest text-cyan-500">Humain</th>
                        <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-widest text-amber-500">Mouvement</th>
                        <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-widest text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {topCameras.map((cam, i) => (
                        <tr key={cam.name} className="hover:bg-gray-800/40 transition">
                          <td className="px-5 py-3.5 text-sm font-mono text-gray-600">#{i + 1}</td>
                          <td className="px-5 py-3.5 text-sm text-gray-200">{cam.name}</td>
                          <td className="px-5 py-3.5 text-center text-sm font-medium text-cyan-400">{cam.human}</td>
                          <td className="px-5 py-3.5 text-center text-sm font-medium text-amber-400">{cam.motion}</td>
                          <td className="px-5 py-3.5 text-center text-sm font-bold text-white">{cam.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}