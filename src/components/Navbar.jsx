import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { isDark, setIsDark } = useTheme();

  return (
    <header className="nav-el sticky top-0 z-20 flex items-center justify-between border-b border-gray-800 bg-gray-950/90 px-6 py-4 backdrop-blur">
      <div>
        <h2 className="text-lg font-semibold text-white">Centre de supervision</h2>
        <p className="text-sm text-gray-400">Surveillance temps réel</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
          onClick={() => setIsDark(!isDark)}
        >
          {isDark ? "Mode clair" : "Mode sombre"}
        </button>

        <button className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800">
          Paramètres
        </button>
      </div>
    </header>
  );
}