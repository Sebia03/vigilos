import { useState } from "react";
import logo from "../assets/LOGO-SONACOS.png";

export default function Sidebar({
  sites,
  currentPage,
  setCurrentPage,
  selectedCamera,
  setSelectedCamera,
  selectedSite,
  setSelectedSite
}) {
  const [expandedSites, setExpandedSites] = useState({
    dakar: true,
    kaolack: false,
    ziguinchor: false,
  });

  const toggleSite = (siteId) => {
    setExpandedSites((prev) => ({
      ...prev,
      [siteId]: !prev[siteId],
    }));
  };

  const handleCameraClick = (camera) => {
    setSelectedCamera(camera);
    setCurrentPage("cameraView");
  };

  return (
    <aside className="sidebar-el fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-gray-800 bg-gray-950">
      {/* Header / Logo */}
      <div className="border-b border-gray-800 px-4 py-5">
        <div className="flex items-center justify-center">
          <img
            src={logo}
            alt="SONACOS"
            className="h-14 w-auto object-contain"
          />
        </div>
      </div>

      {/* Navigation + Sites */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="mb-6 space-y-2">
          <button
            onClick={() => setCurrentPage("dashboard")}
            className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
              currentPage === "dashboard"
                ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
                : "text-gray-300 hover:bg-gray-800/60"
            }`}
          >
            Accueil
          </button>

          <button
            onClick={() => setCurrentPage("playback")}
            className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
              currentPage === "playback"
                ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
                : "text-gray-300 hover:bg-gray-800/60"
            }`}
          >
            Playback
          </button>

          <button
            onClick={() => setCurrentPage("alerts")}
            className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
              currentPage === "alerts"
                ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
                : "text-gray-300 hover:bg-gray-800/60"
            }`}
          >
            Alertes
          </button>
        </nav>

        <div className="mb-3 px-2 text-xs uppercase tracking-[0.2em] text-gray-500">
          Sites
        </div>

        <div className="space-y-2">
          {sites.map((site) => {
            const isExpanded = expandedSites[site.id] ?? false;
            const hasCameras = Array.isArray(site.cameras) && site.cameras.length > 0;

            return (
              <div key={site.id} className="rounded-2xl">
                {/* Site header */}
                <button
                  onClick={() => {
                    toggleSite(site.id);
                    setSelectedSite(site.id);
                    setCurrentPage("dashboard");
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-gray-200 transition hover:bg-gray-800/60"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">{site.name}</span>
                    <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400">
                      {site.cameras.length}
                    </span>
                  </div>

                  <span className="text-gray-500">{isExpanded ? "−" : "+"}</span>
                </button>

                {/* Cameras list */}
                {isExpanded && (
                  <div className="mt-1 space-y-1 pl-2">
                    {hasCameras ? (
                      site.cameras.map((camera) => {
                        const isSelected = selectedCamera?.id === camera.id;

                        return (
                          <button
                            key={camera.id}
                            onClick={() => handleCameraClick(camera)}
                            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                              isSelected && currentPage === "cameraView"
                                ? "bg-gray-800 text-cyan-400"
                                : "text-gray-400 hover:bg-gray-800/40"
                            }`}
                            title={camera.name}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">{camera.name}</span>

                              <span
                                className={`h-2 w-2 shrink-0 rounded-full ${
                                  camera.status === "online"
                                    ? "bg-emerald-400"
                                    : "bg-red-400"
                                }`}
                              />
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-lg px-3 py-2 text-sm text-gray-500">
                        Aucune caméra
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}