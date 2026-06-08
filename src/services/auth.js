// Helper pour récupérer les headers d'authentification
export function getAuthHeaders() {
  const token = sessionStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}