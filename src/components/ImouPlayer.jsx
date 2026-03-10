import { useEffect, useRef, useState } from "react";
import { fetchKitToken } from "../services/ImouService";

export default function ImouPlayer({ camera }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        const tokenData = await fetchKitToken(
          camera.deviceId,
          camera.channelId ?? 0
        );

        if (cancelled) return;

        if (!tokenData?.kitToken) {
          throw new Error("Token introuvable");
        }

        if (
          playerRef.current &&
          typeof playerRef.current.destroy === "function"
        ) {
          try {
            playerRef.current.destroy();
          } catch (e) {
            console.error("Erreur destroy player :", e);
          }
        }

        containerRef.current.innerHTML = "";

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        playerRef.current = new window.imouPlayer({
          id: containerRef.current.id,
          domain: tokenData.domain,
          width,
          height,
          deviceId: camera.deviceId,
          channelId: camera.channelId ?? 0,
          token: tokenData.kitToken,
          type: 1,
          streamId: 0,
          bSupportMultithread: false,
        });
      } catch (err) {
        console.error("Erreur initialisation ImouPlayer :", err);
        if (!cancelled) {
          setError(err.message || "Erreur inconnue");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timer = setTimeout(() => {
      initPlayer();
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);

      if (
        playerRef.current &&
        typeof playerRef.current.destroy === "function"
      ) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          console.error("Erreur destruction ImouPlayer :", err);
        }
      }

      playerRef.current = null;

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [camera?.deviceId, camera?.channelId]);

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
        id={`imou-player-${camera.deviceId}`}
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