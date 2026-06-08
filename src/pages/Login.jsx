import { useState } from "react";
import logo from "../assets/LOGO-SONACOS.png";
import axios from "axios";

const BASE_URL = "/api";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPwd, setShowPwd]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Veuillez remplir tous les champs."); return; }
    try {
      setLoading(true);
      setError("");
      const res = await axios.post(`${BASE_URL}/login`, { email, password });
      // Passer le token ET le profil au parent
      onLoginSuccess(res.data.user, res.data.access_token);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Identifiants incorrects.");
      } else {
        setError("Erreur de connexion. Vérifiez que le serveur est démarré.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, #fff 40px, #fff 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #fff 40px, #fff 41px)" }} />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl shadow-black/50 overflow-hidden">

          <div className="bg-gray-950 border-b border-gray-800 px-8 py-8 flex flex-col items-center gap-4">
            <img src={logo} alt="SONACOS" className="h-16 w-auto object-contain" />
            <div className="text-center">
              <h1 className="text-lg font-bold text-white tracking-wide">Plateforme de Supervision</h1>
              <p className="text-xs text-gray-500 mt-0.5 font-mono tracking-widest uppercase">VigilOS · Accès sécurisé</p>
            </div>
          </div>

          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-widest text-gray-500">Adresse email</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.sn" autoComplete="email"
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 pl-10 pr-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-widest text-gray-500">Mot de passe</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <input type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" autoComplete="current-password"
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 pl-10 pr-12 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors">
                    {showPwd ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <svg className="h-4 w-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full rounded-xl bg-cyan-500/20 border border-cyan-500/30 py-3 text-sm font-semibold text-cyan-400 transition hover:bg-cyan-500/30 hover:border-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Connexion...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    Se connecter
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="border-t border-gray-800 bg-gray-950 px-8 py-4 text-center">
            <p className="text-xs text-gray-600 font-mono">
              SONACOS · Système de supervision vidéo · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}