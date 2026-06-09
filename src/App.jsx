import { useEffect, useMemo, useState, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import CameraView from "./pages/CameraView";
import Playback from "./pages/Playback";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import Statistics from "./pages/Statistics";
import Login from "./pages/Login";
import { ThemeProvider } from "./context/ThemeContext";
import { fetchImouCameras } from "./services/ImouService";
import axios from "axios";

const BASE_URL = "/api";

// ─── Token helpers ────────────────────────────────────────────────────────────
function getToken()       { return sessionStorage.getItem("access_token"); }
function setToken(token)  { sessionStorage.setItem("access_token", token); }
function removeToken()    { sessionStorage.removeItem("access_token"); }
function getAuthHeaders() { const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {}; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function detectSiteFromName(name = "") {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
  if (normalized.startsWith("LOUGA"))     return "Louga";
  if (normalized.startsWith("KAOLACK"))  return "Kaolack";
  if (normalized.startsWith("KOALOACK")) return "Kaolack";
  if (normalized.startsWith("DIOURBEL")) return "Diourbel";
  return "Dakar";
}

function buildSitesFromCameras(cameras) {
  const grouped = {};
  cameras.forEach((camera) => {
    const siteName = camera.site || "Non défini";
    const siteId   = siteName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (!grouped[siteId]) grouped[siteId] = { id: siteId, name: siteName, cameras: [] };
    grouped[siteId].cameras.push(camera);
  });
  return Object.values(grouped);
}

function formatCameras(data) {
  return data.map((cam, index) => ({
    id:        cam.deviceId || `imou-${index}`,
    name:      cam.deviceName || `Caméra ${index + 1}`,
    status:    cam.status || "offline",
    site:      detectSiteFromName(cam.deviceName),
    deviceId:  cam.deviceId,
    channelId: cam.channelId ?? 0,
    raw:       cam,
  }));
}

function filterCamerasByUser(cameras, currentUser) {
  if (!currentUser) return cameras;
  if (currentUser.role === "superadmin") return cameras;
  if (currentUser.role === "admin_site" && currentUser.site) {
    const userSite = currentUser.site.toLowerCase();
    return cameras.filter((c) =>
      c.site?.toLowerCase() === userSite ||
      c.site?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === userSite
    );
  }
  return cameras;
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-2 animate-pulse">
      <div className="mb-2 flex items-start justify-between gap-3 px-1 pt-1">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-gray-800" />
          <div className="h-3 w-20 rounded bg-gray-800" />
        </div>
        <div className="h-6 w-16 rounded-full bg-gray-800" />
      </div>
      <div className="h-44 w-full rounded-xl bg-gray-800" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-fadeIn p-6">
      <div className="mb-6 space-y-2">
        <div className="h-7 w-48 rounded bg-gray-800 animate-pulse" />
        <div className="h-4 w-72 rounded bg-gray-800 animate-pulse" />
      </div>
      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-800 animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}

const REFRESH_INTERVAL = 120000;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser]         = useState(null);
  const [checkingAuth, setCheckingAuth]       = useState(true);
  const [currentPage, setCurrentPage]         = useState("dashboard");
  const [selectedCamera, setSelectedCamera]   = useState(null);
  const [selectedSite, setSelectedSite]       = useState(null);
  const [imouCameras, setImouCameras]         = useState([]);
  const [loadingCameras, setLoadingCameras]   = useState(true);
  const [lastUpdated, setLastUpdated]         = useState(null);
  const [refreshing, setRefreshing]           = useState(false);
  const [collapsed, setCollapsed]             = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { setCheckingAuth(false); return; }
    axios.get(`${BASE_URL}/me`, { headers: getAuthHeaders() })
      .then((res) => { setIsAuthenticated(true); setCurrentUser(res.data); })
      .catch(() => { removeToken(); setIsAuthenticated(false); })
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleLoginSuccess = (user, token) => {
    setToken(token);
    setIsAuthenticated(true);
    setCurrentUser(user);
    if (user?.role === "admin_site" && user?.site) {
      setSelectedSite(user.site.toLowerCase());
    }
  };

  const handleLogout = async () => {
    try { await axios.post(`${BASE_URL}/logout`, {}, { headers: getAuthHeaders() }); } catch {}
    removeToken();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setImouCameras([]);
    setSelectedSite(null);
  };

  const loadCameras = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoadingCameras(true);
      else setRefreshing(true);
      const data      = await fetchImouCameras();
      const formatted = formatCameras(data);
      setImouCameras((prev) => {
        const prevMap    = Object.fromEntries(prev.map((c) => [c.id, c.status]));
        const hasChanged = formatted.some((c) => prevMap[c.id] !== c.status);
        return hasChanged || prev.length !== formatted.length ? formatted : prev;
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Erreur récupération caméras Imou :", error);
      if (isInitial) setImouCameras([]);
    } finally {
      if (isInitial) setLoadingCameras(false);
      else setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadCameras(true); }, [loadCameras]);
  useEffect(() => {
    const interval = setInterval(() => loadCameras(false), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadCameras]);

  useEffect(() => {
    if (!selectedCamera) return;
    const updated = imouCameras.find((c) => c.id === selectedCamera.id);
    if (updated && updated.status !== selectedCamera.status) setSelectedCamera(updated);
  }, [imouCameras]);

  const filteredCameras = useMemo(
    () => filterCamerasByUser(imouCameras, currentUser),
    [imouCameras, currentUser]
  );
  const sites = useMemo(() => buildSitesFromCameras(filteredCameras), [filteredCameras]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-cyan-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
          <p className="text-sm text-gray-500 font-mono">Vérification...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <Login onLoginSuccess={handleLoginSuccess} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-950 text-white">
        <Sidebar
          sites={sites}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          selectedCamera={selectedCamera}
          setSelectedCamera={setSelectedCamera}
          selectedSite={selectedSite}
          setSelectedSite={setSelectedSite}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          currentUser={currentUser}
        />
        <main className="min-h-screen transition-all duration-300"
          style={{ marginLeft: collapsed ? "64px" : "256px" }}>
          <Navbar
            refreshing={refreshing}
            lastUpdated={lastUpdated}
            onRefresh={() => loadCameras(false)}
            onLogout={handleLogout}
            currentUser={currentUser}
            onSettings={() => setCurrentPage("settings")}
          />
          {loadingCameras ? <DashboardSkeleton /> : (
            <>
              {currentPage === "dashboard" && (
                <Dashboard
                  sites={sites}
                  selectedSite={selectedSite}
                  setSelectedSite={setSelectedSite}
                  selectedCamera={selectedCamera}
                  setSelectedCamera={setSelectedCamera}
                  setCurrentPage={setCurrentPage}
                />
              )}
              {currentPage === "cameraView" && (
                <CameraView
                  camera={selectedCamera}
                  setCurrentPage={setCurrentPage}
                  setSelectedCamera={setSelectedCamera}
                />
              )}
              {currentPage === "playback" && (
                <Playback
                  sites={sites}
                  selectedCamera={selectedCamera}
                  setSelectedCamera={setSelectedCamera}
                />
              )}
              {currentPage === "alerts" && (
                <Alerts
                  selectedSite={selectedSite}
                  selectedCamera={selectedCamera}
                />
              )}
              {currentPage === "statistics" && (
                <Statistics sites={sites} currentUser={currentUser} />
              )}
              {currentPage === "settings" && (
                <Settings currentUser={currentUser} />
              )}
            </>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;