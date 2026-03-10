export const sites = [
  {
    id: "dakar",
    name: "Dakar",
    cameras: [
      { id: "cam-dk-01", name: "Entrée principale", status: "online", site: "Dakar" },
      { id: "cam-dk-02", name: "Parking Nord", status: "online", site: "Dakar" },
      { id: "cam-dk-03", name: "Entrepôt A", status: "offline", site: "Dakar" },
      { id: "cam-dk-04", name: "Périmètre Est", status: "online", site: "Dakar" },
    ],
  },
  {
    id: "kaolack",
    name: "Kaolack",
    cameras: [
      { id: "cam-kl-01", name: "Hall de production", status: "online", site: "Kaolack" },
      { id: "cam-kl-02", name: "Zone de chargement", status: "offline", site: "Kaolack" },
      { id: "cam-kl-03", name: "Bureau sécurité", status: "online", site: "Kaolack" },
    ],
  },
  {
    id: "ziguinchor",
    name: "Ziguinchor",
    cameras: [
      { id: "cam-zg-01", name: "Accès principal", status: "online", site: "Ziguinchor" },
      { id: "cam-zg-02", name: "Salle serveurs", status: "online", site: "Ziguinchor" },
    ],
  },
];

export const allCameras = sites.flatMap((s) => s.cameras);