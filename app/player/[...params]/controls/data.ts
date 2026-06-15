// data.ts

import {
  Gauge,
  ScreenShare,
  FlipHorizontal,
  PictureInPicture,
  AudioLines,
  Volume2,
  Subtitles,
  ALargeSmall,
  Clock,
  Settings2,
  Timer,
  ListVideo,
  SkipForward,
  Repeat,
  Moon,
  Tv,
  Hd,
  Sun,
  Download,
  Languages,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export type DynamicKey =
  | "qualities"
  | "audioTracks"
  | "subtitles"
  | "sourceQualities"
  | "downloads"
  | "dub";

export type SettingsOption = {
  id: string;
  display: string;
  file?: string; // 👈 match MediaOption
};

export interface SelectedValue {
  display: string;
  id: string;
  file?: string;
}

export type SettingsItem = {
  label: string;
  value?: string | null;
  Icon: LucideIcon;
  options?: SettingsOption[];
  dynamicKey?: DynamicKey;
  action?: () => void;
};

export type SettingsGroup = {
  label: string;
  items: SettingsItem[];
};

// helper to keep things concise
function opts(...values: string[]): SettingsOption[] {
  return values.map((v) => ({
    id: v.toLowerCase().replace(/\s/g, "-"),
    display: v,
  }));
}

export const groups: SettingsGroup[] = [
  {
    label: "Video & Audio",
    items: [
      {
        label: "Quality",
        value: "Auto",
        Icon: Hd,
        options: [],
        dynamicKey: "qualities",
      },

      {
        label: "Source quality",
        value: "Auto",
        Icon: Tv,
        options: [],
        dynamicKey: "sourceQualities",
      },
      {
        label: "Audio Dub",
        value: "Auto",
        Icon: Languages,
        options: [],
        dynamicKey: "dub",
      },
      {
        label: "Download",
        value: "",
        Icon: Download,
        options: [],
        dynamicKey: "downloads",
      },
      {
        label: "Aspect Ratio",
        value: "16:9",
        Icon: ScreenShare,
        options: opts("16:9", "4:3", "21:9", "Fill"),
      },
      {
        label: "Brightness",
        value: "100%",
        Icon: Sun,
        options: opts("50%", "75%", "100%", "125%", "150%", "200%"),
      },
      {
        label: "Mirror",
        value: "Off",
        Icon: FlipHorizontal,
        options: opts("Off", "On"),
      },
      { label: "Picture in picture", value: null, Icon: PictureInPicture },
      {
        label: "Audio track",
        value: "Default",
        Icon: AudioLines,
        options: [],
        dynamicKey: "audioTracks",
      },
      // {
      //   label: "Audio boost",
      //   value: "Off",
      //   Icon: Volume2,
      //   options: opts("Off", "Low", "Medium", "High"),
      // },
    ],
  },
  {
    label: "Subtitles",
    items: [
      {
        label: "Subtitles",
        value: "Off",
        Icon: Subtitles,
        options: [],
        dynamicKey: "subtitles",
      },
      {
        label: "Dual subtitles",
        value: "Off",
        Icon: Subtitles,
        options: [],
        dynamicKey: "subtitles",
      },
      // {
      //   label: "Font size",
      //   value: "Medium",
      //   Icon: ALargeSmall,
      //   options: opts("Small", "Medium", "Large", "X-Large"),
      // },
      // {
      //   label: "Sync offset",
      //   value: "0.0s",
      //   Icon: Clock,
      //   options: opts(
      //     "-2.0s",
      //     "-1.0s",
      //     "-0.5s",
      //     "0.0s",
      //     "+0.5s",
      //     "+1.0s",
      //     "+2.0s",
      //   ),
      // },
      { label: "Subtitle settings", value: null, Icon: Settings2 },
    ],
  },
  {
    label: "Playback",
    items: [
      {
        label: "Playback speed",
        value: "1×",
        Icon: Timer,
        options: opts("0.25×", "0.5×", "0.75×", "1×", "1.25×", "1.5×", "2×"),
      },
      {
        label: "Autoplay",
        value: "On",
        Icon: ListVideo,
        options: opts("Off", "On"),
      },

      { label: "Loop", value: "Off", Icon: Repeat, options: opts("Off", "On") },
      {
        label: "Sleep timer",
        value: "Off",
        Icon: Moon,
        options: [
          { id: "off", display: "Off" },
          { id: "15", display: "15 min" },
          { id: "30", display: "30 min" },
          { id: "45", display: "45 min" },
          { id: "60", display: "60 min" },
        ],
      },
    ],
  },
];
