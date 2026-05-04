import { useEffect, useRef, useState } from "react";
import { fetchKitToken } from "../services/ImouService";

export default function ImouPlayer({ camera, onError, playbackTime = null }) {
  // playbackTime: { beginTime: "2026-05-04 13:51:21", endTime: "2026-05-04 13:52:21" }
  const containerRef = useRef(null);
  const playerRef    = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initPlayer() {
      if (!camera?.deviceId) return;
      if (!containerRef.current) return;
      if (typeof window.imouPlayer === "undefined") {
        setError("SDK Imou non chargé");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const tokenData = await fetchKitToken(camera.deviceId, camera.channelId ?? 0);
        if (cancelled) return;
        if (!tokenData?.kitToken) throw new Error("Token introuvable");

        if (playerRef.current && typeof playerRef.current.destroy === "function") {
          try { playerRef.current.destroy(); } catch (e) {}
        }
        containerRef.current.innerHTML = "";

        const width  = containerRef.current.clientWidth  || 640;
        const height = containerRef.current.clientHeight || 360;

        const params = {
          id:                  containerRef.current.id,
          domain:              tokenData.domain,
          width,
          height,
          deviceId:            camera.deviceId,
          channelId:           camera.channelId ?? 0,
          token:               tokenData.kitToken,
          type:                1,
          streamId:            0,
          bSupportMultithread: false,
          encryptPwd:          "",
        };

        // Mode playback si playbackTime fourni
        if (playbackTime?.beginTime && playbackTime?.endTime) {
          params.recordType = "device";
          params.beginTime  = playbackTime.beginTime;
          params.endTime    = playbackTime.endTime;
        }

        playerRef.current = new window.imouPlayer(params);
      } catch (err) {
        if (!cancelled) {
          const msg = err.message || "Erreur inconnue";
          setError(msg);
          if (onError) onError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timer = setTimeout(initPlayer, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try { playerRef.current.destroy(); } catch {}
      }
      playerRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [camera?.deviceId, camera?.channelId, playbackTime?.beginTime, playbackTime?.endTime]);

  if (!camera?.deviceId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-gray-500">
        Flux simulé
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <div
        id={`imou-player-${camera.deviceId}-${playbackTime ? "pb" : "live"}`}
        ref={containerRef}
        className="h-full w-full"
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm text-gray-300">
          Chargement...
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-4 text-center text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}