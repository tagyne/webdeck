import {
  CircleCheckBig,
  Clapperboard,
  Eye,
  EyeOff,
  Image,
  Mic,
  MicOff,
  Monitor,
  Pause,
  Play,
  Radio,
  Settings,
  Square,
  TriangleAlert,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  type LucideProps,
} from "lucide-react";

import type { WebdeckIconName } from "./types";

const iconMap: Record<WebdeckIconName, (props: LucideProps) => JSX.Element> = {
  mic: Mic,
  "mic-off": MicOff,
  "volume-2": Volume2,
  "volume-x": VolumeX,
  video: Video,
  "video-off": VideoOff,
  eye: Eye,
  "eye-off": EyeOff,
  radio: Radio,
  play: Play,
  pause: Pause,
  square: Square,
  clapperboard: Clapperboard,
  monitor: Monitor,
  image: Image,
  settings: Settings,
  "triangle-alert": TriangleAlert,
  "circle-check-big": CircleCheckBig,
};

export function LucideIcon({
  name,
  ...props
}: LucideProps & { name: WebdeckIconName }) {
  const Icon = iconMap[name];
  return <Icon {...props} />;
}
