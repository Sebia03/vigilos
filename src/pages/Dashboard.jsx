export default function Dashboard({
  sites,
  selectedSite,
  selectedCamera,
  setSelectedCamera,
  setCurrentPage,
}) {
  const allCameras = sites.flatMap((site) => site.cameras);

  const currentSite = selectedSite
    ? sites.find((site) => site.id === selectedSite) || null
    : null;

  const visibleCameras = currentSite ? currentSite.cameras : allCameras;

  const totalCameras = visibleCameras.length;

  const onlineCameras = visibleCameras.filter(
    (camera) => camera.status === "online"
  ).length;

  const sleepCameras = visibleCameras.filter(
    (camera) => camera.status === "sleep"
  ).length;

  const offlineCameras = visibleCameras.filter(
    (camera) => camera.status === "offline"
  ).length;

  const activeSites = selectedSite
    ? currentSite && currentSite.cameras.length > 0
      ? 1
      : 0
    : sites.filter((site) => site.cameras.length > 0).length;

  const handleCameraClick = (camera) => {
    setSelectedCamera(camera);
    if (setCurrentPage) {
      setCurrentPage("cameraView");
    }
  };

  const getStatusLabel = (status) => {
    if (status === "online") return "EN LIGNE";
    if (status === "sleep") return "VEILLE";
    return "HORS LIGNE";
  };

  const getStatusClass = (status) => {
    if (status === "online") {
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
    if (status === "sleep") {
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    }
    return "bg-red-500/10 text-red-400 border border-red-500/20";
  };

  const getPreviewContent = (camera) => {
    if (camera.status === "online") {
      return (
        <div className="flex h-full w-full items-center justify-center text-center">
          <div>
            <p className="text-sm font-medium text-emerald-400">
              Caméra disponible
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Cliquez pour ouvrir le live
            </p>
          </div>
        </div>
      );
    }

    if (camera.status === "sleep") {
      return (
        <div className="flex h-full w-full items-center justify-center text-center">
          <div>
            <p className="text-sm font-medium text-amber-400">
              Caméra en veille
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Cliquez pour tenter le flux
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full w-full items-center justify-center text-center">
        <div>
          <p className="text-sm font-medium text-gray-300">
            Caméra hors ligne
          </p>
          <p className="mt-1 text-xs text-gray-500">{camera.deviceId}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fadeIn p-6">
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

      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-yellow-500/80 bg-yellow-500/85 p-4">
          <p className="text-sm text-yellow-100">Total caméras</p>
          <h3 className="mt-1 text-5xl font-bold text-white">{totalCameras}</h3>
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
          <p className="text-sm text-emerald-100">
            {selectedSite ? "Site affiché" : "Sites actifs"}
          </p>
          <h3 className="mt-1 text-5xl font-bold text-white">{activeSites}</h3>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">
          {currentSite ? `Caméras - ${currentSite.name}` : "Aperçu des caméras"}
        </h2>

        <p className="mt-1 text-sm text-gray-400">
          {sleepCameras > 0 && `${sleepCameras} caméra(s) en veille`}
        </p>
      </div>

      {visibleCameras.length === 0 ? (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center text-gray-400">
          Aucune caméra disponible pour ce site.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleCameras.map((camera) => {
            const isSelected = selectedCamera?.id === camera.id;

            return (
              <div
                key={camera.id}
                onClick={() => handleCameraClick(camera)}
                className={`cursor-pointer overflow-hidden rounded-xl border bg-gray-900 p-2 transition ${
                  isSelected
                    ? "border-cyan-500/40 ring-1 ring-cyan-500/20"
                    : "border-gray-800 hover:border-cyan-500/40 hover:scale-[1.01]"
                }`}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-white">
                      {camera.name}
                    </h3>
                    <p className="text-sm text-gray-400">{camera.site}</p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                      camera.status
                    )}`}
                  >
                    {getStatusLabel(camera.status)}
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl bg-black">
                  <div className="h-44 w-full">
                    {getPreviewContent(camera)}
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