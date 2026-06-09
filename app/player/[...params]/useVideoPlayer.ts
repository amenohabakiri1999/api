import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { useSettingsStore } from "@/zustand/settings-store";
import { useVideoProgressStore } from "@/zustand/videoProgressStore";
export interface VideoPlayerState {
  playing: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  fullscreen: boolean;
  pip: boolean;
  waiting: boolean;
  ended: boolean;
  canPlay: boolean;
}
export interface QualityLevel {
  bitrate: number;
  height: number;
  width: number;
  frameRate: number;
  id: number;
  name?: string;
  url: string[];
}
export interface VideoPlayerControls {
  togglePlay: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  togglePip: () => void;
  skipBy: (seconds: number) => void;
  seek: (time: number) => void;
  handleSeekChange: (value: number[]) => void;
  handleSeekCommit: (value: number[]) => void;
  skipTo: (time: number) => void;
  skipToTime: (seconds: number) => void;
}
export interface AudioTrackTypes {
  id: number;
  name: string;
  lang?: string;
  groupId: string;
  default?: boolean;
  autoselect?: boolean;
}

export interface SubtitleTrackTypes {
  id: number;
  name: string;
  lang?: string;
  groupId: string;
  default: boolean;
  autoselect: boolean;
  forced: boolean;
}

export function useVideoPlayer({
  playerSrc,
  srcType,
  serverIndex,
  progressKey,
  initialMuted = false,
  enableSaveProgress = true, // ← new
  enableLoadProgress = true, // ← new
  load,
  handleServerFail,
}: {
  playerSrc: string | null;
  srcType: string;
  serverIndex: number;
  progressKey: string;
  initialMuted?: boolean;
  enableSaveProgress?: boolean; // ← new
  enableLoadProgress?: boolean; // ← new
  load?: number;
  handleServerFail: () => void;
}) {
  const [quality, setQuality] = useState<QualityLevel[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrackTypes[]>([]);

  const qualityId = useSettingsStore((s) => s.values["Quality"]?.id ?? "auto");
  const audioId = useSettingsStore((s) => s.values["Audio track"]?.id ?? null);

  const [state, setState] = useState<VideoPlayerState>({
    playing: false,
    currentTime: 0,
    duration: 0,
    buffered: 0,
    volume: 1,
    muted: initialMuted,
    fullscreen: false,
    pip: false,
    waiting: false,
    ended: false,
    canPlay: false,
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSeekingRef = useRef(false);
  const hlsRef = useRef<Hls | null>(null);
  const hasRestoredRef = useRef(false);
  const lastPostRef = useRef(0);
  const lastSaveRef = useRef(0);
  const has90PercentFiredRef = useRef(false);
  const lastSavedTimeRef = useRef(0);
  //
  const playbackSpeed = useSettingsStore(
    (state) => state.values["Playback speed"]?.id ?? "1×",
  );
  const sleepTimer = useSettingsStore(
    (state) => state.values["Sleep timer"]?.id ?? "off",
  );
  const autoplay = useSettingsStore(
    (state) => state.values["Autoplay"]?.id ?? "on",
  );
  const loop = useSettingsStore((state) => state.values["Loop"]?.id ?? "off");
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = parseFloat(playbackSpeed); // "1.5×" → 1.5
  }, [playbackSpeed]);

  useEffect(() => {
    hasRestoredRef.current = false;
    has90PercentFiredRef.current = false;
  }, [playerSrc, progressKey, load]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playerSrc) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported() && srcType === "hls") {
      const hls = new Hls();

      hls.loadSource(playerSrc);
      hls.attachMedia(video);

      hlsRef.current = hls;
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          handleServerFail();
        }
      });
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        video.play().catch(() => {});
        setQuality(data.levels);

        useSettingsStore.getState().setValue("Quality", {
          display: "Auto",
          id: "auto",
        });
      });
      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        setAudioTracks(data.audioTracks);
        const first = data.audioTracks[0];
        if (first) {
          useSettingsStore.getState().setValue("Audio track", {
            display: first.lang
              ? `${first.name} (${first.lang.toUpperCase()})`
              : first.name,
            id: "0", // index 0
          });
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else {
      video.src = playerSrc;
    }
  }, [playerSrc, srcType]);

  useEffect(() => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = qualityId === "auto" ? -1 : Number(qualityId);
  }, [qualityId]);

  useEffect(() => {
    if (!hlsRef.current) return;
    hlsRef.current.audioTrack = audioId === null ? 0 : Number(audioId);
  }, [audioId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // const onTimeUpdate = () => {
    //   if (isSeekingRef.current) return;

    //   const time = video.currentTime;
    //   if (Math.abs(lastSavedTimeRef.current - time) < 1) return;

    //   lastSavedTimeRef.current = time;

    //   if (video.duration > 0) {
    //     if (enableSaveProgress) {
    //       // ← guard
    //       useVideoProgressStore
    //         .getState()
    //         .saveProgress(progressKey, time, video.duration);
    //     }

    //     window.parent.postMessage(
    //       {
    //         type: "VIDEO_PROGRESS",
    //         payload: {
    //           progressKey,
    //           currentTime: time,
    //           duration: video.duration,
    //           percent: Math.round((time / video.duration) * 100),
    //         },
    //       },
    //       "*",
    //     );
    //   }

    //   setState((p) => ({ ...p, currentTime: time, ended: video.ended }));
    // };
    const onTimeUpdate = () => {
      if (isSeekingRef.current) return;

      const time = video.currentTime;

      if (video.duration > 0) {
        const now = Date.now();

        // =========================
        // 💾 SAVE PROGRESS (every 1s)
        // =========================
        if (enableSaveProgress) {
          if (now - lastSaveRef.current >= 1000) {
            lastSaveRef.current = now;
            useVideoProgressStore
              .getState()
              .saveProgress(progressKey, time, video.duration);
          }
        }

        // =========================
        // 📡 POST MESSAGE (only after 1 min, then every 60s)
        // =========================
        if (time >= 60) {
          if (now - lastPostRef.current >= 60_000) {
            lastPostRef.current = now;
            window.parent.postMessage(
              {
                type: "VIDEO_PROGRESS",
                payload: {
                  progressKey,
                  currentTime: time,
                  duration: video.duration,
                  percent: Math.round((time / video.duration) * 100),
                },
              },
              "*",
            );
          }
        }

        // =========================
        // 📡 POST MESSAGE AT 90%
        // =========================
        if (!has90PercentFiredRef.current && time / video.duration >= 0.9) {
          has90PercentFiredRef.current = true;
          window.parent.postMessage(
            {
              type: "VIDEO_NINETY_PERCENT",
              payload: {
                progressKey,
                currentTime: time,
                duration: video.duration,
              },
            },
            "*",
          );
        }
      }

      setState((p) => ({
        ...p,
        currentTime: time,
        ended: video.ended,
      }));
    };
    const onDurationChange = () =>
      setState((p) => ({ ...p, duration: video.duration || 0 }));
    const onProgress = () =>
      setState((p) => ({
        ...p,
        buffered:
          video.buffered.length > 0
            ? video.buffered.end(video.buffered.length - 1)
            : 0,
      }));
    const onVolumeChange = () =>
      setState((p) => ({ ...p, volume: video.volume, muted: video.muted }));
    const onWaiting = () => setState((p) => ({ ...p, waiting: true }));

    const onPlaying = () => {
      window.parent.postMessage({ type: "VIDEO_PLAY" }, "*");
      setState((p) => ({ ...p, waiting: false, playing: true }));
    };

    const onPause = () => {
      window.parent.postMessage({ type: "VIDEO_PAUSE" }, "*");
      setState((p) => ({ ...p, playing: false }));
    };

    const onEnded = () => {
      window.parent.postMessage(
        { type: "VIDEO_ENDED", payload: { progressKey } },
        "*",
      );
      if (enableSaveProgress) {
        // ← guard
        useVideoProgressStore.getState().clearProgress(progressKey);
      }
      setState((p) => ({ ...p, playing: false, ended: true }));
    };
    const onPip = () => setState((p) => ({ ...p, pip: true }));
    const onLeavePip = () => setState((p) => ({ ...p, pip: false }));
    const onFullscreenChange = () =>
      setState((p) => ({ ...p, fullscreen: !!document.fullscreenElement }));

    const onCanPlay = () => {
      if (!hasRestoredRef.current) {
        const MIN_RESTORE_SECONDS = 5;

        // `load` param takes priority over stored progress
        if (load !== undefined && load > 0) {
          video.currentTime = load;
          setState((p) => ({ ...p, currentTime: load }));
        } else if (enableLoadProgress) {
          // ← guard
          const saved = useVideoProgressStore
            .getState()
            .getProgress(progressKey);
          if (saved && saved.currentTime > MIN_RESTORE_SECONDS) {
            video.currentTime = saved.currentTime;
            setState((p) => ({ ...p, currentTime: saved.currentTime }));
          }
        }

        hasRestoredRef.current = true;
      }
      setState((p) => ({ ...p, waiting: false, canPlay: true }));
    };

    const onLoadStart = () =>
      setState((p) => ({ ...p, waiting: true, canPlay: false }));
    const onSeeking = () => {
      isSeekingRef.current = true;
    };
    const onSeeked = () => {
      isSeekingRef.current = false;
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("progress", onProgress);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("play", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("enterpictureinpicture", onPip);
    video.addEventListener("leavepictureinpicture", onLeavePip);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("loadstart", onLoadStart);
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("seeked", onSeeked);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("play", onPlaying);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("enterpictureinpicture", onPip);
      video.removeEventListener("leavepictureinpicture", onLeavePip);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("loadstart", onLoadStart);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("seeked", onSeeked);
    };
  }, [playerSrc]);

  useEffect(() => {
    setQuality([]);
    setAudioTracks([]);
    useSettingsStore
      .getState()
      .setValue("Source quality", { display: "Auto", id: "0" });
    useSettingsStore
      .getState()
      .setValue("Quality", { display: "Auto", id: "auto" });
    useSettingsStore
      .getState()
      .setValue("Audio track", { display: "Default", id: "0" });

    setState((p) => ({ ...p, canPlay: false, waiting: true, playing: false }));
  }, [serverIndex]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = initialMuted;
  }, []); // runs once on mount

  useEffect(() => {
    if (sleepTimer === "off") return;

    const minutes = Number(sleepTimer);
    const ms = minutes * 60 * 1000;

    const timeout = setTimeout(() => {
      if (!videoRef.current?.paused) {
        videoRef.current?.pause();
      }
      useSettingsStore.getState().setValue("Sleep timer", {
        display: "Off",
        id: "off",
      });
    }, ms);

    return () => clearTimeout(timeout);
  }, [sleepTimer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.loop = loop === "on";
  }, [loop]);

  const seek = useCallback((time: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = time;
    setState((p) => ({
      ...p,
      currentTime: time,
      ended: time < p.duration ? false : p.ended,
    }));
  }, []);

  const controls: VideoPlayerControls = {
    togglePlay: useCallback(() => {
      const v = videoRef.current;
      if (!v) return;
      v.paused ? v.play().catch(() => {}) : v.pause();
    }, []),

    setVolume: useCallback((vol: number) => {
      const v = videoRef.current;
      if (!v) return;
      v.volume = Math.max(0, Math.min(1, vol));
      v.muted = vol === 0;
    }, []),

    toggleMute: useCallback(() => {
      const v = videoRef.current;
      if (!v) return;
      v.muted = !v.muted;
    }, []),

    toggleFullscreen: useCallback(() => {
      const container = containerRef.current;
      if (!container) return;
      document.fullscreenElement
        ? document.exitFullscreen()
        : container.requestFullscreen();
    }, []),

    togglePip: useCallback(async () => {
      const v = videoRef.current;
      if (!v) return;
      document.pictureInPictureElement
        ? await document.exitPictureInPicture()
        : await v.requestPictureInPicture();
    }, []),

    skipBy: useCallback(
      (seconds: number) => {
        const v = videoRef.current;
        if (!v) return;
        const newTime = Math.max(
          0,
          Math.min(v.currentTime + seconds, v.duration || 0),
        );
        seek(newTime);
      },
      [seek],
    ),

    // Preview thumb position while dragging — does NOT move the video yet
    handleSeekChange: useCallback((value: number[]) => {
      isSeekingRef.current = true;
      setState((p) => ({ ...p, currentTime: value[0] }));
    }, []),

    // Commit the seek when the user releases the slider
    handleSeekCommit: useCallback((value: number[]) => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = value[0];
      setState((p) => ({
        ...p,
        currentTime: value[0],
        ended: value[0] < p.duration ? false : p.ended,
      }));
    }, []),

    seek,

    // Alias for seek — moves video to an exact time without resetting ended
    skipTo: useCallback((time: number) => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = time;
      setState((p) => ({ ...p, currentTime: time }));
    }, []),

    // Same as seek but always clears ended flag
    skipToTime: useCallback(
      (seconds: number) => {
        seek(seconds);
        setState((p) => ({ ...p, ended: false }));
      },
      [seek],
    ),
  };
  return {
    videoRef,
    containerRef,
    state,
    controls,
    quality,
    setQuality,
    audioTracks,
    setAudioTracks,
  };
}
