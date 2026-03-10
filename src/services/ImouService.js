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