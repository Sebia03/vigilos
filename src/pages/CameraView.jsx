import ImouPlayer from "../components/ImouPlayer";

export default function CameraView({
  camera,
  setCurrentPage,
  setSelectedCamera,
}) {
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

  return (
    <div className="animate-fadeIn p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{camera.name}</h1>
          <p className="mt-1 text-sm text-gray-400">{camera.site}</p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              isOnline
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {isOnline ? "EN LIGNE" : "HORS LIGNE"}
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

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-3 shadow-lg shadow-black/20">
        <div className="overflow-hidden rounded-2xl bg-black">
          <div className="aspect-video w-full">
            {isOnline ? (
              <ImouPlayer camera={camera} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg text-gray-400">
                Device offline
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}