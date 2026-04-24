import { useEffect, useMemo, useState } from "react";
import { fetchAlerts } from "../services/ImouService";

export default function Alerts({ selectedCamera = null, selectedSite = null }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deviceId = selectedCamera?.deviceId || selectedCamera?.id;
  const cameraName = selectedCamera?.name || "Caméra";
  const channelId = selectedCamera?.channelId ?? 0;

  useEffect(() => {
    if (!deviceId) {
      setAlerts([]);
      setLoading(false);
      setError(null);
      return;
    }

    loadCameraAlerts();

    const interval = setInterval(() => {
      loadCameraAlerts();
    }, 15000);

    return () => clearInterval(interval);
  }, [deviceId, channelId]);

  const loadCameraAlerts = async () => {
    if (!deviceId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await fetchAlerts(deviceId, channelId);
      const cameraAlerts = data?.success ? data.alarms || [] : [];

      const sortedAlerts = [...cameraAlerts].sort((a, b) => {
        const da = new Date(a.localDate || 0).getTime();
        const db = new Date(b.localDate || 0).getTime();
        return db - da;
      });

      setAlerts(sortedAlerts);
    } catch (err) {
      console.error("Erreur chargement alertes caméra:", err);
      setError("Impossible de charger les alertes");
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const title = useMemo(() => {
    if (!selectedCamera) return "Alertes";
    return `Alertes - ${cameraName}`;
  }, [selectedCamera, cameraName]);

  const getAlertTitle = (alert) => {
    if (
      alert.msgType === "human" ||
      alert.labelType === "humanAlarm" ||
      alert.typeLabel === "human_detection"
    ) {
      return "Détection humaine";
    }

    if (
      alert.msgType === "videoMotion" ||
      alert.typeLabel === "motion_detection"
    ) {
      return "Détection de mouvement";
    }

    return "Alerte";
  };

  const getAlertImage = (alert) => {
    return alert.thumbUrl || alert.picurlArray?.[0] || null;
  };

  if (!selectedSite || !selectedCamera) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white">Alertes</h1>
        <p className="mt-2 text-gray-400">
          Sélectionnez une caméra dans la section Alertes.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-1 text-sm text-gray-400">
          Alertes de la caméra sélectionnée
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
          <p className="text-sm text-cyan-200">Caméra</p>
          <h3 className="mt-1 text-xl font-bold text-white">{cameraName}</h3>
        </div>

        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <p className="text-sm text-yellow-200">Device ID</p>
          <h3 className="mt-1 break-all text-sm font-bold text-white">
            {deviceId}
          </h3>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-sm text-emerald-200">Nombre d’alertes</p>
          <h3 className="mt-1 text-4xl font-bold text-white">
            {alerts.length}
          </h3>
        </div>
      </div>

      {loading && (
        <p className="text-gray-400">Chargement des alertes...</p>
      )}

      {error && (
        <p className="text-red-500">{error}</p>
      )}

      {!loading && !error && alerts.length === 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center text-gray-400">
          Aucune alerte pour cette caméra.
        </div>
      )}

      {!loading && !error && alerts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {alerts.map((alert) => {
            const imageUrl = getAlertImage(alert);

            return (
              <div
                key={alert.alarmId}
                className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow"
              >
                <div className="h-44 w-full bg-slate-700">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={getAlertTitle(alert)}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                      Image non disponible
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <p className="text-lg font-semibold text-white">
                    {getAlertTitle(alert)}
                  </p>

                  <p className="mt-1 text-sm text-gray-400">
                    {alert.localDate || alert.raw?.localDate || "Date indisponible"}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Canal : {alert.channelId}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}