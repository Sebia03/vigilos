export function mapImouCamera(camera) {
  return {
    id: camera.deviceId || camera.id,
    name: camera.deviceName || camera.name || "Caméra sans nom",
    status: camera.online ? "online" : "offline",
    site: "Dakar",
    deviceId: camera.deviceId || camera.id,
  };
}