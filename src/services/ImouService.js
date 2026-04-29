import axios from "axios";

const BASE_URL = "http://127.0.0.1:5000";

export async function fetchImouCameras() {
  const response = await axios.get(`${BASE_URL}/devices`);
  return response.data;
}

export async function fetchKitToken(deviceId, channelId = 0) {
  const response = await axios.post(`${BASE_URL}/kit-token`, {
    deviceId,
    channelId,
    type: "1",
  });

  return response.data;
}

export async function fetchDeviceOnline(deviceId) {
  const response = await axios.post(`${BASE_URL}/device-online`, {
    deviceId,
  });
  

  return response.data;
}
export async function fetchAlerts(deviceId, channelId = 0) {
  const response = await axios.get(`${BASE_URL}/alerts`, {
    params: {
      deviceId,
      channelId,
    },
  });

  return response.data;
}
export function proxyImageUrl(originalUrl) {
  if (!originalUrl) return null;
  return `http://127.0.0.1:5000/image-proxy?url=${encodeURIComponent(originalUrl)}`;
}
export async function wakeupDevice(deviceId) {
  const response = await axios.post(`${BASE_URL}/wakeup`, { deviceId });
  return response.data;
}