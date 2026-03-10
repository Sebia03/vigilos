import ImouPlayer from "../components/ImouPlayer";

export default function Dashboard({
  sites,
  selectedCamera,
  setSelectedCamera,
}) {
  const allCameras = sites.flatMap((site) => site.cameras);

  const totalCameras = allCameras.length;
  const onlineCameras = allCameras.filter(
    (camera) => camera.status === "online"
  ).length;
  const offlineCameras = totalCameras - onlineCameras;
  const activeSites = sites.filter((site) => site.cameras.length > 0).length;

  return (
    <div className="animate-fadeIn p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Vue d&apos;ensemble</h1>
        <p className="mt-1 text-sm text-gray-400">
          Supervision des sites et aperçu rapide des caméras
        </p>
      </div>

      {/* Statistiques */}
      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-yellow-500/80 bg-yellow-500/85 p-4">
          <p className="text-sm text-yellow-100">Total caméras</p>
          <h3 className="mt-1 text-5xl font-bold text-white">
            {totalCameras}
          </h3>
        </div>

        <div className="rounded-xl border border-green-500/80 bg-green-500/85 p-4">
          <p className="text-sm text-green-100">Caméras en ligne</p>
          <h3 className="mt-1 text-5xl font-bold text-white">
            {onlineCameras}
          </h3>
        </div>

        <div className="rounded-xl border border-red-500/80 bg-red-500/85 p-4">
          <p className="text-sm text-red-100">Caméras hors ligne</p>
          <h3 className="mt-1 text-5xl font-bold text-white">
            {offlineCameras}
          </h3>
        </div>

        <div className="rounded-xl border border-emerald-500/80 bg-emerald-600/85 p-4">
          <p className="text-sm text-emerald-100">Sites actifs</p>
          <h3 className="mt-1 text-5xl font-bold text-white">
            {activeSites}
          </h3>
        </div>
      </div>

      {/* Titre section */}
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Aperçu des caméras
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Affichage de toutes les caméras disponibles
          </p>
        </div>

        {selectedCamera && (
          <button
            onClick={() => setSelectedCamera(null)}
            className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
          >
            Réinitialiser la vue
          </button>
        )}
      </div>

      {/* Grille caméras */}
      {allCameras.length === 0 ? (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center text-gray-400">
          Aucune caméra disponible pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {allCameras.map((camera) => {
            const isOnline = camera.status === "online";
            const isSelected = selectedCamera?.id === camera.id;

            return (
              <div
                key={camera.id}
                className={`rounded-xl border bg-gray-900 p-2 shadow-lg shadow-black/20 transition ${
                  isSelected
                    ? "border-cyan-500/40 ring-1 ring-cyan-500/20"
                    : "border-gray-800"
                }`}
              >
                {/* En-tête card */}
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-white">
                      {camera.name}
                    </h3>
                    <p className="text-sm text-gray-400">{camera.site}</p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      isOnline
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {isOnline ? "EN LIGNE" : "HORS LIGNE"}
                  </span>
                </div>

                {/* Fenêtre preview compacte */}
                <div
                  onClick={() => setSelectedCamera(camera)}
                  className="cursor-pointer overflow-hidden rounded-xl bg-black"
                >
                  <div className="h-44 w-full overflow-hidden">
                    <div className="h-full w-full [&>*]:h-full [&>*]:w-full">
                      <ImouPlayer camera={camera} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}