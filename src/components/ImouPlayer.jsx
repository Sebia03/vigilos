import { useEffect, useRef, useState, useCallback } from "react";
import { fetchKitToken, wakeupDevice } from "../services/ImouService";

const MAX_RETRIES     = 3;
const RETRY_DELAY_MS  = 3000;

export default function ImouPlayer({ camera, onError, playbackTime = null }) {
  const containerRef  = useRef(null);
  const playerRef     = useRef(null);
  const retryTimerRef = useRef(null);
  const builtSizeRef  = useRef({ width: 0, height: 0 }); // dimensions utilisées à la dernière construction du player

  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [waking, setWaking]       = useState(false);
  const [sdkFailed, setSdkFailed] = useState(false); // détecté via MutationObserver
  const [sdkErrorText, setSdkErrorText] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [retryTick, setRetryTick]   = useState(0);   // force la ré-initialisation du player
  const [resizeTick, setResizeTick] = useState(0);    // force une reconstruction si la taille réelle a changé

  // Réinitialise le compteur de tentatives à chaque changement de caméra
  useEffect(() => {
    setRetryCount(0);
  }, [camera?.deviceId]);

  useEffect(() => {
    let cancelled = false;
    let mutationObserver = null;

    async function initPlayer() {
      if (!camera?.deviceId) return;
      if (!containerRef.current) return;
      if (typeof window.imouPlayer === "undefined") {
        setError("SDK Imou non chargé");
        return;
      }

      setLoading(true);
      setError("");
      setSdkFailed(false);
      setSdkErrorText("");

      try {
        // Réveiller la caméra si elle est en veille
        if (camera.status === "sleep") {
          setWaking(true);
          try {
            await wakeupDevice(camera.deviceId);
            // Attendre 3 secondes que la caméra soit prête
            await new Promise((resolve) => setTimeout(resolve, 6000));
          } catch (e) {
            console.warn("Wakeup échoué, tentative quand même...");
          }
          if (cancelled) return;
          setWaking(false);
        }

        const tokenData = await fetchKitToken(camera.deviceId, camera.channelId ?? 0);
        if (cancelled) return;
        if (!tokenData?.kitToken) throw new Error("Token introuvable");

        if (playerRef.current && typeof playerRef.current.destroy === "function") {
          try { playerRef.current.destroy(); } catch (e) {}
        }
        containerRef.current.innerHTML = "";

        // Attendre deux frames avant de mesurer : garantit que le navigateur a
        // terminé un cycle complet de layout/paint. Un simple setTimeout fixe
        // peut ne pas suffire quand plusieurs lecteurs se montent en même
        // temps (ex: mode multi-écran) et se disputent le temps de rendu.
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        if (cancelled || !containerRef.current) return;

        const width  = containerRef.current.clientWidth  || 640;
        const height = containerRef.current.clientHeight || 360;
        builtSizeRef.current = { width, height };

        const params = {
          id:                  containerRef.current.id,
          domain:              tokenData.domain,
          width,
          height,
          deviceId:            camera.deviceId,
          channelId:           camera.channelId ?? 0,
          token:               tokenData.kitToken,
          type:                1, // 1-Live; 2-Playback
          streamId:            0, // 0-HD; 1-SD — valeur par défaut du SDK officiel, indépendante du streamId utilisé pour générer le kitToken côté HTTP
          bSupportMultithread: false,
          // D'après la doc officielle (open.imoulife.com/book/js/sdk.html) :
          // si le device n'a ni clé de chiffrement personnalisée ni mot de
          // passe device défini, il faut utiliser son numéro de série (SN)
          // par défaut — PAS une chaîne vide, contrairement à ce qu'on
          // faisait jusqu'ici.
          encryptPwd:          camera.encryptPwd || camera.deviceId,
        };

        // Mode playback si playbackTime fourni
        if (playbackTime?.beginTime && playbackTime?.endTime) {
          params.recordType = "device";
          params.beginTime  = playbackTime.beginTime;
          params.endTime    = playbackTime.endTime;
        }

        playerRef.current = new window.imouPlayer(params);

        // ⚠️ Le SDK Imou peut échouer *après* son instanciation (ex: échec du
        // play() interne) et injecte alors son propre message d'erreur
        // directement dans le DOM du conteneur, sans passer par une exception
        // JS ni par un callback qu'on contrôle. On surveille cette apparition
        // pour pouvoir réagir (retry) — à remplacer par l'API d'événements du
        // SDK si elle existe (ex: player.on('error', cb)), plus fiable.
        // Le SDK Imou remonte plusieurs messages d'erreur différents selon la
        // cause (échec de lecture, device injoignable, timeout réseau...).
        // On les couvre tous ici plutôt que de ne chercher qu'un seul texte.
        const SDK_ERROR_PATTERN = /play failed|no response|error code\s*:?\s*\d+/i;
        mutationObserver = new MutationObserver(() => {
          const text = containerRef.current?.textContent || "";
          if (SDK_ERROR_PATTERN.test(text)) {
            setSdkErrorText(text.trim());
            setSdkFailed(true);
          }
        });
        mutationObserver.observe(containerRef.current, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      } catch (err) {
        if (!cancelled) {
          const msg = err.message || "Erreur inconnue";
          setError(msg);
          setWaking(false);
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
      mutationObserver?.disconnect();
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try { playerRef.current.destroy(); } catch {}
      }
      playerRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
    // Note: camera?.status est volontairement EXCLU de ces dépendances.
    // Un changement de statut backend pendant une lecture déjà active (ex:
    // caméra solaire qui bascule en veille après quelques minutes) ne doit
    // pas détruire/reconstruire tout le player. Le statut courant est quand
    // même lu au moment de l'exécution ci-dessus (via la closure `camera`),
    // donc un retry déclenché par retryTick verra bien le statut à jour.
  }, [camera?.deviceId, camera?.channelId, playbackTime?.beginTime, playbackTime?.endTime, retryTick, resizeTick]);

  // Auto-correction : si la taille réelle du conteneur diverge sensiblement
  // de celle utilisée pour construire le player SDK (ex: 4 lecteurs montés
  // simultanément en mode multi-écran, grille pas encore stabilisée au
  // moment de la mesure initiale), on force une reconstruction avec la
  // bonne taille — plutôt que de rester figé sur une mesure erronée.
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    let debounceTimer = null;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const built = builtSizeRef.current;
      const deltaW = Math.abs(width - built.width);
      const deltaH = Math.abs(height - built.height);
      // Tolérance de quelques pixels pour ignorer les micro-ajustements sans intérêt
      if (built.width > 0 && (deltaW > 10 || deltaH > 10)) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => setResizeTick((t) => t + 1), 250);
      }
    });

    observer.observe(el);
    return () => {
      clearTimeout(debounceTimer);
      observer.disconnect();
    };
  }, [camera?.deviceId, camera?.channelId]);

  // Retry automatique quand le SDK signale un échec de lecture
  useEffect(() => {
    if (!sdkFailed) return;
    if (onError) onError(sdkErrorText || "Échec de lecture SDK Imou");
    if (retryCount >= MAX_RETRIES) return;

    retryTimerRef.current = setTimeout(() => {
      setRetryCount((c) => c + 1);
      setSdkFailed(false);
      setRetryTick((t) => t + 1); // relance initPlayer via l'effet principal
    }, RETRY_DELAY_MS);

    return () => clearTimeout(retryTimerRef.current);
  }, [sdkFailed, retryCount, onError]);

  const handleManualRetry = useCallback(() => {
    setRetryCount(0);
    setSdkFailed(false);
    setRetryTick((t) => t + 1);
  }, []);

  if (!camera?.deviceId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-gray-500">
        Flux simulé
      </div>
    );
  }

  const retriesExhausted = sdkFailed && retryCount >= MAX_RETRIES;
  const retryingNow      = sdkFailed && retryCount < MAX_RETRIES;

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <div
        id={`imou-player-${camera.deviceId}-${playbackTime ? "pb" : "live"}`}
        ref={containerRef}
        className="h-full w-full"
      />
      {(loading || waking) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
          <svg className="h-6 w-6 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
          <p className="text-xs text-gray-400 font-mono">
            {waking ? "Réveil de la caméra..." : "Chargement..."}
          </p>
        </div>
      )}
      {retryingNow && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 px-4 text-center">
          <svg className="h-5 w-5 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
          <p className="text-xs text-amber-400 font-mono">
            Nouvelle tentative... ({retryCount + 1}/{MAX_RETRIES})
          </p>
          {sdkErrorText && <p className="text-[10px] text-gray-500 font-mono">{sdkErrorText}</p>}
        </div>
      )}
      {retriesExhausted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-4 text-center">
          <p className="text-sm text-red-400">Flux indisponible après {MAX_RETRIES} tentatives</p>
          {sdkErrorText && <p className="text-[10px] text-gray-500 font-mono">{sdkErrorText}</p>}
          <button
            onClick={handleManualRetry}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 transition hover:bg-white/10"
          >
            Réessayer
          </button>
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