import { useState } from "react";
import ImouPlayer from "../components/ImouPlayer";

export default function CameraView({
  camera,
  setCurrentPage,
  setSelectedCamera,
}) {
  const [wakeupFailed, setWakeupFailed] = useState(false);

  if (!camera) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h1 className="text-2xl font-bold text-white">Vue caméra</h1>
          <p className="mt-2 text-gray-400">Aucune caméra sélectionnée.</p>
        </div>
      </div>
    );
  }

  const isOnline = camera.status === "online";
  const isSleep  = camera.status === "sleep";
  const canPlay  = isOnline || isSleep; // on tente le player pour sleep aussi

  const statusLabel = isOnline ? "EN LIGNE" : isSleep ? "VEILLE" : "HORS LIGNE";
  const statusClass = isOnline
    ? "bg-green-500/20 text-green-400"
    : isSleep
    ? "bg-amber-500/20 text-amber-400"
    : "bg-red-500/20 text-red-400";

  return (
    <div className="animate-fadeIn p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{camera.name}</h1>
          <p className="mt-1 text-sm text-gray-400">{camera.site}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusClass}`}>
            {statusLabel}
          </span>

          <button
            onClick={() => {
              setSelectedCamera(null);
              setCurrentPage("dashboard");
            }}
            className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
          >
            Retour au dashboard
          </button>
        </div>
      </div>

      {/* Banner veille */}
      {isSleep && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <svg className="h-5 w-5 shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-amber-300">
            Caméra en veille — tentative de connexion en cours, cela peut prendre quelques secondes...
          </p>
        </div>
      )}

      {/* Player */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-3 shadow-lg shadow-black/20">
        <div className="overflow-hidden rounded-2xl bg-black">
          <div className="aspect-video w-full">
            {canPlay ? (
              <ImouPlayer
                camera={camera}
                onError={() => setWakeupFailed(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg text-gray-400">
                Caméra hors ligne
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message échec réveil */}
      {wakeupFailed && isSleep && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          Impossible de réveiller la caméra pour le moment. Réessayez dans quelques instants.
        </div>
      )}
    </div>
  );
}