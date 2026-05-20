import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";

const BASE_URL = "http://localhost:5000";
const SITES = ["dakar", "louga", "kaolack", "diourbel"];
const SITE_LABELS = { dakar: "Dakar", louga: "Louga", kaolack: "Kaolack", diourbel: "Diourbel" };

// ─── Modal Utilisateur ────────────────────────────────────────────────────────
function UserModal({ user, onClose, onSave }) {
  const isEdit = !!user?.id;
  const [form, setForm] = useState({
    email:    user?.email || "",
    password: "",
    role:     user?.role  || "admin_site",
    site:     user?.site  || "dakar",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async () => {
    if (!form.email) { setError("Email requis"); return; }
    if (!isEdit && !form.password) { setError("Mot de passe requis"); return; }
    try {
      setLoading(true);
      setError("");
      const payload = {
        email:    form.email,
        role:     form.role,
        site:     form.role === "superadmin" ? null : form.site,
        ...(form.password ? { password: form.password } : {}),
      };
      if (isEdit) {
        await axios.put(`${BASE_URL}/users/${user.id}`, payload, { withCredentials: true });
      } else {
        await axios.post(`${BASE_URL}/users`, payload, { withCredentials: true });
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <h2 className="text-base font-semibold text-white">
            {isEdit ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          </h2>
          <button onClick={onClose} className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800">
            Fermer
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-widest text-gray-500">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@sonacos.sn"
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-widest text-gray-500">
              Mot de passe {isEdit && <span className="text-gray-600 normal-case">(laisser vide pour ne pas changer)</span>}
            </label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-widest text-gray-500">Rôle</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-200 outline-none focus:border-cyan-500/50">
              <option value="admin_site">Admin Site</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
          {form.role === "admin_site" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-widest text-gray-500">Site</label>
              <select value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-200 outline-none focus:border-cyan-500/50">
                {SITES.map((s) => <option key={s} value={s}>{SITE_LABELS[s]}</option>)}
              </select>
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full rounded-xl bg-cyan-500/20 border border-cyan-500/30 py-3 text-sm font-semibold text-cyan-400 transition hover:bg-cyan-500/30 disabled:opacity-50">
            {loading ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer l'utilisateur"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section Utilisateurs ─────────────────────────────────────────────────────
function UsersSection() {
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [modalUser, setModalUser]     = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError]             = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/users`, { withCredentials: true });
      setUsers(res.data);
    } catch {
      setError("Impossible de charger les utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleDelete = async (userId) => {
    try {
      await axios.delete(`${BASE_URL}/users/${userId}`, { withCredentials: true });
      setDeleteConfirm(null);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur suppression");
    }
  };

  const getRoleBadge = (role) => {
    if (role === "superadmin") return (
      <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-400">Super Admin</span>
    );
    return (
      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400">Admin Site</span>
    );
  };

  return (
    <div>
      {modalUser !== null && (
        <UserModal user={modalUser} onClose={() => setModalUser(null)} onSave={() => { setModalUser(null); loadUsers(); }} />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-950 p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white">Confirmer la suppression</h3>
            <p className="mt-2 text-sm text-gray-400">
              Supprimer <span className="font-medium text-white">{deleteConfirm.email}</span> ? Cette action est irréversible.
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-gray-700 bg-gray-900 py-2.5 text-sm text-gray-300 hover:bg-gray-800">
                Annuler
              </button>
              <button onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-400">{users.length} utilisateur{users.length > 1 ? "s" : ""} enregistré{users.length > 1 ? "s" : ""}</p>
        <button onClick={() => setModalUser({})}
          className="flex items-center gap-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-sm font-medium text-cyan-400 transition hover:bg-cyan-500/30">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nouvel utilisateur
        </button>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-800" />)}</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-widest text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-widest text-gray-500">Rôle</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-widest text-gray-500">Site</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-widest text-gray-500">Créé le</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-widest text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-gray-900/50">
              {users.map((user) => (
                <tr key={user.id} className="transition hover:bg-gray-800/40">
                  <td className="px-4 py-3.5 text-sm text-gray-200">{user.email}</td>
                  <td className="px-4 py-3.5">{getRoleBadge(user.role)}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-400">
                    {user.site ? SITE_LABELS[user.site] || user.site : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-500 font-mono">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setModalUser(user)}
                        className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-300 transition hover:bg-gray-700">
                        Modifier
                      </button>
                      {user.role !== "superadmin" && (
                        <button onClick={() => setDeleteConfirm(user)}
                          className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/20">
                          Supprimer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
export default function Settings({ currentUser }) {
  const { isDark, setIsDark } = useTheme();
  const [activeTab, setActiveTab] = useState(currentUser?.role === "superadmin" ? "users" : "general");

  const tabs = [
    ...(currentUser?.role === "superadmin" ? [{ id: "users", label: "Utilisateurs" }] : []),
    { id: "general", label: "Général" },
  ];

  return (
    <div className="animate-fadeIn p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="mt-1 text-sm text-gray-400">Configuration de la plateforme VigilOS</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-800 pb-0">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {activeTab === "users" && currentUser?.role === "superadmin" && (
        <UsersSection />
      )}

      {activeTab === "general" && (
        <div className="space-y-4">
          {/* Thème */}
          <div className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-5">
            <div>
              <p className="text-sm font-medium text-white">Thème d'affichage</p>
              <p className="text-xs text-gray-500 mt-0.5">Basculer entre le mode sombre et le mode clair</p>
            </div>
            <button onClick={() => setIsDark(!isDark)}
              className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-200 transition hover:bg-gray-700">
              {isDark ? "Passer en mode clair" : "Passer en mode sombre"}
            </button>
          </div>

          {/* Infos compte */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-sm font-medium text-white mb-3">Mon compte</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Email</span>
                <span className="text-sm text-gray-200">{currentUser?.email || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Rôle</span>
                <span className="text-sm text-gray-200">
                  {currentUser?.role === "superadmin" ? "Super Administrateur" : "Administrateur Site"}
                </span>
              </div>
              {currentUser?.site && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Site assigné</span>
                  <span className="text-sm text-gray-200 capitalize">{currentUser.site}</span>
                </div>
              )}
            </div>
          </div>

          {/* Version */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-sm font-medium text-white mb-3">À propos</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Plateforme</span>
                <span className="text-sm text-gray-200">VigilOS</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Organisation</span>
                <span className="text-sm text-gray-200">SONACOS</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Année</span>
                <span className="text-sm text-gray-200">{new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}