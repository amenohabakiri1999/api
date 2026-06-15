import { ArrowLeftIcon } from "@/components/icons/arrow";
import { CcOffIcon, CcOnIcon } from "@/components/icons/cc";
import { MaximizeIcon, MinimizeIcon } from "@/components/icons/fullscreen";
import { PauseIcon, PlayIcon } from "@/components/icons/play-pause";
import { VolumeOffIcon, VolumeOnIcon } from "@/components/icons/volume";
import { Slider } from "@/components/ui/slider";
import Settings from "@/app/player/[...params]/controls/index";
import {
  AudioTrackTypes,
  QualityLevel,
  VideoPlayerControls,
  VideoPlayerState,
} from "../useVideoPlayer";
import { MediaOption } from "@/hooks/open-subtitle";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { formatTime } from "@/lib/format-time";
import { motion } from "framer-motion";
import Episodes from "../episodes";
import { useRouter } from "next/navigation";
import { DubTypes, QualityTrack } from "@/hooks/source";
import Link from "next/link";
import { Cloud } from "lucide-react";
import { CloudIcon } from "@/components/icons/cloud";
import { ServerIcon } from "@/components/icons/server";
import { DownloadIcon } from "@/components/icons/download";
export interface VideoControlsProps {
  state: VideoPlayerState;
  controls: VideoPlayerControls;
  playerSrc: string | null;
  tmdbId: string;
  imdbId: string | null;
  season: number;
  episode: number;
  media_type: string;
  currentTime: number;
  skipBy: (skip: number) => void;
  year: string;
  genre: string;
  //
  quality: QualityLevel[];
  audioTracks: AudioTrackTypes[];
  //

  mergeSubtitles: MediaOption[];
  dubs: DubTypes[]
  //
  title: string;
  //
  onPip: () => void;
  //
  cCToggle: boolean;
  setCcToggle: Dispatch<SetStateAction<boolean>>;

  //
  resetTimer: () => void;
  lockTimer: () => void;
  //
  totalSeasons: number;

  source: QualityTrack[];
  //
  color: string;
  back: boolean;

  canNext: boolean;
  nextSeason: number;
  nextEpisode: number;

  showServer: boolean;
  setShowServer: Dispatch<SetStateAction<boolean>>;
}
export default function MainControls({
  state,
  controls,
  playerSrc,
  tmdbId,
  imdbId,
  season,
  episode,
  media_type,
  currentTime,
  skipBy,
  year,
  genre,
  //
  quality,
  audioTracks,
  //

  mergeSubtitles,
  dubs,
  //

  title,
  //
  onPip,
  //
  cCToggle,
  setCcToggle,
  //
  resetTimer,
  lockTimer,
  //
  totalSeasons,
  //
  source,
  color,
  back,

  ///
  canNext,
  nextEpisode,
  nextSeason,
  showServer,
  setShowServer,
}: VideoControlsProps) {
  const router = useRouter();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const handleSliderHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current || !state.duration) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const percent = Math.min(Math.max(x / rect.width, 0), 1);
    const time = percent * state.duration;

    setHoverX(x);
    setHoverTime(time);
  };
  const clearHover = () => {
    setHoverTime(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="z-10 absolute inset-0  flex flex-col justify-between pointer-events-none bg-linear-to-t from-black/80 via-transparent to-black/50"
      onPointerMove={lockTimer}
    >
      <div className="lg:px-4 px-2 py-3 flex justify-between items-center pointer-events-auto">
        {back && (
          <button onClick={() => router.back()} className="cursor-pointer">
            <ArrowLeftIcon className="lg:size-13 md:size-10 size-8  max-[340px]:size-5.5 text-muted-foreground" />
          </button>
        )}
        {/* <div className="text-center absolute -translate-x-1/2 left-1/2 lg:top-5 top-3">
          <h1 className="lg:text-2xl md:text-xl font-semibold">{title}</h1>
          <div className="flex gap-3 justify-center  text-muted-foreground lg:mt-1 font-medium lg:text-base text-sm">
            <p>2024</p> |<p>Animation</p>|<p>PG</p>
          </div>
        </div> */}
        <div></div>
      </div>
      <div className="w-full lg:px-4 px-2   max-[340px]:px-1 lg:py-6 py-3  max-[340px]:py-1.5  space-y-3  max-[340px]:space-y-1  ">
        <div className="lg:p-4 p-2  max-[340px]:p-1  pointer-events-none">
          <span className="flex lg:gap-3 gap-1.5  max-[340px]:gap-1 items-center">
            <div
              className="lg:w-1 w-0.5  lg:h-5 h-3  max-[340px]:h-2 rounded-full"
              style={{ backgroundColor: `#${color}` }}
            ></div>
            <p className="lg:text-lg text-sm  max-[340px]:text-[0.6rem] text-muted-foreground">
              Your'e Watching
            </p>
          </span>
          <h1 className="lg:text-4xl text-xl  max-[340px]:text-sm font-bold tracking-wide lg:mt-2 mt-1  max-[340px]:mt-0.5">
            {title}
          </h1>
          <div className="flex gap-3  max-[340px]:gap-1.5  text-muted-foreground lg:mt-3 mt-1.5  max-[340px]:mt-0.5 font-medium lg:text-lg text-sm  max-[340px]:text-[0.6rem]">
            <p>{year}</p> |<p>{genre}</p>|
            <p className="">{media_type === "tv" ? "TV Show" : "Movie"}</p>
          </div>
        </div>
        <div className="space-y-3  max-[340px]:space-y-1 pointer-events-auto ">
          <div className="group  lg:h-4 h-2  max-[340px]:h-1 lg:px-3 px-2  max-[340px]:px-1 flex justify-center items-center ">
            <div
              className="relative w-full"
              ref={sliderRef}
              onMouseMove={handleSliderHover}
              onMouseLeave={clearHover}
            >
              {/* Buffered bar */}
              <div className="absolute inset-0 rounded pointer-events-none">
                <div
                  className="h-full bg-muted-foreground/50 rounded"
                  style={{
                    width: state.duration
                      ? `${(state.buffered / state.duration) * 100}%`
                      : "0%",
                  }}
                />
              </div>

              {hoverTime !== null && (
                <div
                  className="absolute -top-8 px-2 py-1  text-sm rounded bg-background/70 backdrop-blur-2xl text-foreground pointer-events-none z-40"
                  style={{
                    left: hoverX,
                    transform: "translateX(-50%)",
                  }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}
              <Slider
                value={[state.currentTime]}
                max={state.duration || 1}
                step={0.1}
                onValueChange={(value) => controls.handleSeekChange(value)}
                onValueCommit={(value) => controls.handleSeekCommit(value)}
                className="relative z-10"
                // disabled={!state.canPlay}
                color={color}
              />
            </div>
          </div>
          <div className="flex justify-between items-center w-full  ">
            <div className="flex items-center lg:gap-3 gap-2  max-[340px]:gap-1.5">
              <button
                onClick={controls.togglePlay}
                // disabled={!state.canPlay}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                {state.playing ? (
                  <motion.div
                    key="pause"
                    initial={{ opacity: 0, scale: 1.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.5 }}
                    transition={{ duration: 0.1 }}
                  >
                    <PauseIcon className="lg:size-13 md:size-10 size-8  max-[340px]:size-5.5 " />
                  </motion.div>
                ) : (
                  <motion.div
                    key="play"
                    initial={{ opacity: 0, scale: 1.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.5 }}
                    transition={{ duration: 0.1 }}
                  >
                    <PlayIcon className=" lg:size-13 md:size-10 size-8  max-[340px]:size-5.5" />
                  </motion.div>
                )}
              </button>

              <div className="flex items-center gap-2 group">
                <button
                  onClick={controls.toggleMute}
                  className="text-white/80 hover:text-white cursor-pointer"
                >
                  {state.muted || state.volume === 0 ? (
                    <VolumeOffIcon className="lg:size-13 md:size-10 size-8  max-[340px]:size-5.5" />
                  ) : (
                    <VolumeOnIcon className="lg:size-13 md:size-10 size-8  max-[340px]:size-5.5" />
                  )}
                </button>
                <Slider
                  value={[state.muted ? 0 : state.volume]}
                  min={0}
                  max={1}
                  step={0.02}
                  onValueChange={([v]) => controls.setVolume(v)}
                  className=" w-0 group-hover:w-24 transition-[width] duration-200 ease-in-out"
                  color={color}
                />
              </div>
              <div className="flex lg:gap-2 gap-1 items-center lg:ml-2 lg:text-base text-sm  max-[340px]:text-xs">
                <span>{formatTime(state.currentTime)}</span>/
                <span>{formatTime(state.duration)}</span>
              </div>

              {media_type === "tv" && canNext && (
                <Link
                  className=" cursor-pointer text-muted-foreground hidden lg:block"
                  href={`/player/tv/${tmdbId}/${nextSeason}/${nextEpisode}`}
                >
                  Next Episode S{nextSeason}-E{nextEpisode}
                </Link>
              )}
            </div>

            <div className="flex items-center lg:gap-4 gap-2  max-[340px]:gap-1.5">
              <Settings
                mergeSubtitles={mergeSubtitles}
                quality={quality}
                audioTracks={audioTracks}
                //
                onPip={onPip}
                //
                imdbId={imdbId}
                season={season}
                episode={episode}
                media_type={media_type}
                //
                resetTimer={resetTimer}
                lockTimer={lockTimer}
                source={source}
                dubs={dubs}
              />
              {media_type === "tv" && (
                <Episodes
                  tmdbId={tmdbId}
                  season={season}
                  episode={episode}
                  lockTimer={lockTimer}
                  resetTimer={resetTimer}
                  totalSeasons={totalSeasons}
                />
              )}
              {/* <button
                className="text-white/80 hover:text-white cursor-pointer"
                onClick={() => setCcToggle((prev) => !prev)}
              >
                {cCToggle ? (
                  <CcOnIcon className="lg:size-13 md:size-10 size-8  max-[340px]:size-5.5" />
                ) : (
                  <CcOffIcon className="lg:size-13 md:size-10 size-8  max-[340px]:size-5.5" />
                )}
              </button> */}
              {/* <button className="text-white/80 hover:text-white cursor-pointer">
                <ServerIcon className="lg:size-12 md:size-9 size-7  max-[340px]:size-5.5" />
              </button> */}
              <button
                onClick={controls.toggleFullscreen}
                className="cursor-pointer text-white/80 hover:text-white"
              >
                {state.fullscreen ? (
                  <MinimizeIcon className="lg:size-13 md:size-10 size-8  max-[340px]:size-5.5" />
                ) : (
                  <MaximizeIcon className="lg:size-13 md:size-10 size-8  max-[340px]:size-5.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
