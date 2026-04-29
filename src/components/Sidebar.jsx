import { useState } from "react";
import logo from "../assets/LOGO-SONACOS.png";

// ─── Icônes ───────────────────────────────────────────────────────────────────
const IconHome = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const IconPlayback = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
  </svg>
);

const IconAlerts = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

const IconCamera = () => (
  <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
  </svg>
);

const IconLocation = () => (
  <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

const IconChevron = ({ open }) => (
  <svg className={`h-3 w-3 shrink-0 text-gray-600 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
    fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// Bouton toggle sidebar
const IconSidebarCollapse = ({ collapsed }) => (
  <svg className={`h-4 w-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
    fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M11.25 9l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StatusDot = ({ status }) => {
  const color = status === "online" ? "bg-emerald-400" : status === "sleep" ? "bg-amber-400" : "bg-red-400";
  return <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />;
};

function SiteStatusBar({ cameras }) {
  const total   = cameras.length;
  const online  = cameras.filter((c) => c.status === "online").length;
  const sleep   = cameras.filter((c) => c.status === "sleep").length;
  const offline = total - online - sleep;
  if (total === 0) return null;
  return (
    <div className="mt-1.5 flex h-1 w-full overflow-hidden rounded-full bg-gray-800">
      <div className="bg-emerald-500 transition-all" style={{ width: `${(online  / total) * 100}%` }} />
      <div className="bg-amber-400  transition-all" style={{ width: `${(sleep   / total) * 100}%` }} />
      <div className="bg-red-500    transition-all" style={{ width: `${(offline / total) * 100}%` }} />
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar({
  sites,
  currentPage,
  setCurrentPage,
  selectedCamera,
  setSelectedCamera,
  selectedSite,
  setSelectedSite,
  collapsed,
  setCollapsed,
}) {
  const [expandedSites, setExpandedSites]           = useState({ dakar: true });
  const [expandedAlertSites, setExpandedAlertSites] = useState({ dakar: true });

  const toggleSite  = (id) => setExpandedSites((p)     => ({ ...p, [id]: !p[id] }));
  const toggleAlert = (id) => setExpandedAlertSites((p) => ({ ...p, [id]: !p[id] }));

  const handleCameraClick = (camera, siteId) => {
    setSelectedSite(siteId);
    setSelectedCamera(camera);
    setCurrentPage("cameraView");
    // Si sidebar repliée, on la laisse repliée
  };

  const handleAlertCameraClick = (camera, siteId) => {
    setSelectedSite(siteId);
    setSelectedCamera(camera);
    setCurrentPage("alerts");
  };

  const navItems = [
    { id: "dashboard", label: "Accueil",  Icon: IconHome },
    { id: "playback",  label: "Playback", Icon: IconPlayback },
    { id: "alerts",    label: "Alertes",  Icon: IconAlerts },
  ];

  const sidebarWidth = collapsed ? "w-16" : "w-64";

  return (
    <aside
      className={`sidebar-el fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-gray-800 bg-gray-950 transition-all duration-300 ease-in-out ${sidebarWidth}`}
    >
      {/* Header : logo + toggle */}
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-4">
        {!collapsed && (
          <div className="flex flex-1 items-center justify-center overflow-hidden">
            <img src={logo} alt="SONACOS" className="h-12 w-auto object-contain" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`shrink-0 rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-800 hover:text-gray-200 ${collapsed ? "mx-auto" : "ml-2"}`}
          title={collapsed ? "Déplier la sidebar" : "Replier la sidebar"}
        >
          <IconSidebarCollapse collapsed={collapsed} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">

        {/* Navigation principale */}
        <nav className={`mb-5 space-y-1 ${collapsed ? "px-2" : "px-3"}`}>
          {navItems.map(({ id, label, Icon }) => {
            const isActive = currentPage === id;
            return (
              <button
                key={id}
                onClick={() => setCurrentPage(id)}
                title={collapsed ? label : undefined}
                className={`flex w-full items-center rounded-xl transition
                  ${collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"}
                  text-sm font-medium
                  ${isActive
                    ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
                    : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
                  }`}
              >
                <span className={isActive ? "text-cyan-400" : "text-gray-500"}>
                  <Icon />
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{label}</span>
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Mode réduit : juste des icônes de sites */}
        {collapsed ? (
          <div className="px-2 space-y-1">
            {/* Séparateur */}
            <div className="my-2 border-t border-gray-800" />
            {sites.map((site) => {
              const onlineCount = site.cameras.filter((c) => c.status === "online").length;
              const isActive = currentPage === "dashboard" && selectedSite === site.id;
              return (
                <button
                  key={site.id}
                  onClick={() => { setSelectedSite(site.id); setCurrentPage("dashboard"); }}
                  title={site.name}
                  className={`relative flex w-full items-center justify-center rounded-xl py-2.5 transition
                    ${isActive ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-400" : "text-gray-500 hover:bg-gray-800/60 hover:text-gray-300"}`}
                >
                  <IconLocation />
                  {onlineCount > 0 && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <>
            {/* Séparateur Sites */}
            <div className="mb-2 flex items-center gap-2 px-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600">Sites</span>
              <div className="flex-1 border-t border-gray-800" />
            </div>

            <div className="mb-5 space-y-1 px-3">
              {sites.map((site) => {
                const isExpanded  = expandedSites[site.id] ?? false;
                const isActive    = currentPage === "dashboard" && selectedSite === site.id;
                const hasCameras  = Array.isArray(site.cameras) && site.cameras.length > 0;
                const onlineCount = site.cameras.filter((c) => c.status === "online").length;

                return (
                  <div key={site.id}>
                    <button
                      onClick={() => { toggleSite(site.id); setSelectedSite(site.id); setCurrentPage("dashboard"); }}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition
                        ${isActive ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-400" : "text-gray-300 hover:bg-gray-800/60"}`}
                    >
                      <span className={isActive ? "text-cyan-400" : "text-gray-500"}><IconLocation /></span>
                      <span className="flex-1 truncate text-left font-medium">{site.name}</span>
                      {onlineCount > 0 && (
                        <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                          {onlineCount}
                        </span>
                      )}
                      <span className="rounded-full bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-500">
                        {site.cameras.length}
                      </span>
                      <IconChevron open={isExpanded} />
                    </button>

                    {hasCameras && (
                      <div className="px-3"><SiteStatusBar cameras={site.cameras} /></div>
                    )}

                    {isExpanded && hasCameras && (
                      <div className="mt-1 space-y-0.5 pl-3">
                        {site.cameras.map((camera) => {
                          const key = camera.id || camera.deviceId;
                          const isSel = (selectedCamera?.id || selectedCamera?.deviceId) === key && currentPage === "cameraView";
                          return (
                            <button key={key} onClick={() => handleCameraClick(camera, site.id)}
                              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition
                                ${isSel ? "bg-gray-800 text-cyan-400" : "text-gray-500 hover:bg-gray-800/40 hover:text-gray-300"}`}
                            >
                              <span className={isSel ? "text-cyan-400" : "text-gray-600"}><IconCamera /></span>
                              <span className="flex-1 truncate">{camera.name}</span>
                              <StatusDot status={camera.status} />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {isExpanded && !hasCameras && (
                      <p className="px-3 py-2 text-xs text-gray-600">Aucune caméra</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Séparateur Alertes */}
            <div className="mb-2 flex items-center gap-2 px-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600">Alertes</span>
              <div className="flex-1 border-t border-gray-800" />
            </div>

            <div className="space-y-1 px-3">
              {sites.map((site) => {
                const isExpanded = expandedAlertSites[site.id] ?? false;
                const isActive   = currentPage === "alerts" && selectedSite === site.id;
                const hasCameras = Array.isArray(site.cameras) && site.cameras.length > 0;

                return (
                  <div key={`alert-${site.id}`}>
                    <button
                      onClick={() => { toggleAlert(site.id); setSelectedSite(site.id); setCurrentPage("alerts"); }}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition
                        ${isActive ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-400" : "text-gray-300 hover:bg-gray-800/60"}`}
                    >
                      <span className={isActive ? "text-cyan-400" : "text-gray-500"}><IconLocation /></span>
                      <span className="flex-1 truncate text-left font-medium">{site.name}</span>
                      <span className="rounded-full bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-500">
                        {site.cameras.length}
                      </span>
                      <IconChevron open={isExpanded} />
                    </button>

                    {isExpanded && hasCameras && (
                      <div className="mt-1 space-y-0.5 pl-3">
                        {site.cameras.map((camera) => {
                          const key = camera.id || camera.deviceId;
                          const isSel = (selectedCamera?.id || selectedCamera?.deviceId) === key && currentPage === "alerts";
                          return (
                            <button key={`alert-cam-${key}`} onClick={() => handleAlertCameraClick(camera, site.id)}
                              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition
                                ${isSel ? "bg-gray-800 text-cyan-400" : "text-gray-500 hover:bg-gray-800/40 hover:text-gray-300"}`}
                            >
                              <span className={isSel ? "text-cyan-400" : "text-gray-600"}><IconCamera /></span>
                              <span className="flex-1 truncate">{camera.name}</span>
                              <StatusDot status={camera.status} />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {isExpanded && !hasCameras && (
                      <p className="px-3 py-2 text-xs text-gray-600">Aucune caméra</p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className={`border-t border-gray-800 px-3 py-3 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
        ) : (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-xs text-gray-600">Système opérationnel</span>
          </div>
        )}
      </div>
    </aside>
  );
}