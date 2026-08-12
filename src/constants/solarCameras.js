// Caméras solaires connues (modèle WW4U5TSD/Cell PT) : ce modèle ne supporte
// pas getKitToken (SDK Imou classique) et doit TOUJOURS passer par le flux
// HLS, quel que soit son statut instantané (online/sleep/offline) — le
// statut d'une caméra solaire change en permanence, ce n'est pas un critère
// de routage ou d'affichage fiable.
export const SOLAR_DEVICE_IDS = new Set([
  "E7998CBPSFCA40A", // MkE
  "4909BBDPSF5EE12", // Allongement mur logement
  "4909BBDPSFC73D9", // Raffinage porte mur droite
  "4909BBDPSF92B70", // Raffinage derrière Tanks Droit
  "49461BDPSF0193F", // Raffinage Derrière Tanks Gauche
  "49461BDPSF182ED", // Raffinage face entree
  "4909BBDPSFBA388", // BelAir Derrière 2
  "4909BBDPSFA78FC", // BelAir Derriere 1
]);

export function isSolarCamera(camera) {
  return !!camera?.deviceId && SOLAR_DEVICE_IDS.has(camera.deviceId);
}