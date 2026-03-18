import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import CameraView from "./pages/CameraView";
import Playback from "./pages/Playback";
import Alerts from "./pages/Alerts";
import { ThemeProvider } from "./context/ThemeContext";
import { fetchImouCameras } from "./services/ImouService";

function detectSiteFromName(name = "") {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

  if (normalized.startsWith("LOUGA")) return "Louga";
  if (normalized.startsWith("KAOLACK")) return "Kaolack";
  if (normalized.startsWith("KOALOACK")) return "Kaolack";
  if (normalized.startsWith("DIOURBEL")) return "Diourbel";

  return "Dakar";
}

function buildSitesFromCameras(cameras) {
  const grouped = {};

  cameras.forEach((camera) => {
    const siteName = camera.site || "Non défini";
    const siteId = siteName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (!grouped[siteId]) {
      grouped[siteId] = {
        id: siteId,
        name: siteName,
        cameras: [],
      };
    }

    grouped[siteId].cameras.push(camera);
  });

  return Object.values(grouped);
}

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [imouCameras, setImouCameras] = useState([]);
  const [loadingCameras, setLoadingCameras] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadCameras() {
      try {
        setLoadingCameras(true);

        const data = await fetchImouCameras();

        if (cancelled) return;

        const formattedCameras = data.map((cam, index) => ({
          id: cam.deviceId || `imou-${index}`,
          name: cam.deviceName || `Caméra ${index + 1}`,
          status: cam.status || "offline",
          site: detectSiteFromName(cam.deviceName),
          deviceId: cam.deviceId,
          channelId: cam.channelId ?? 0,
          raw: cam,
        }));

        setImouCameras(formattedCameras);
      } catch (error) {
        console.error("Erreur récupération caméras Imou :", error);
        if (!cancelled) setImouCameras([]);
      } finally {
        if (!cancelled) setLoadingCameras(false);
      }
    }

    loadCameras();

    return () => {
      cancelled = true;
    };
  }, []);

  const sites = useMemo(() => buildSitesFromCameras(imouCameras), [imouCameras]);

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
      />
        <main className="ml-64 min-h-screen">
          <Navbar />

          {loadingCameras ? (
            <div className="p-6">
              <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-gray-400">
                Chargement des caméras...
              </div>
            </div>
          ) : (
            <>
              {currentPage === "dashboard" && (
                <Dashboard
                  sites={sites}
                  selectedSite={selectedSite}
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

              {currentPage === "alerts" && <Alerts />}
            </>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;