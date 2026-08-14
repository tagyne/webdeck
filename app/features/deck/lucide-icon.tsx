import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import type { ComponentProps } from "react";

export function LucideIcon({
  name,
  ...props
}: Omit<ComponentProps<typeof DynamicIcon>, "name"> & { name: IconName }) {
  return <DynamicIcon name={name} {...props} />;
}
