import {
  Sofa,
  Tv,
  Refrigerator,
  Lamp,
  Utensils,
  Baby,
  Trees,
  Hammer,
  Package,
  Armchair,
  BedDouble,
  WashingMachine,
  CookingPot,
  Microwave,
  Wrench,
  Lightbulb,
  Shirt,
  Car,
  Box,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  sofa: Sofa,
  armchair: Armchair,
  "bed-double": BedDouble,
  tv: Tv,
  refrigerator: Refrigerator,
  microwave: Microwave,
  blender: CookingPot,
  "washing-machine": WashingMachine,
  lamp: Lamp,
  utensils: Utensils,
  baby: Baby,
  trees: Trees,
  hammer: Hammer,
  wrench: Wrench,
  lightbulb: Lightbulb,
  shirt: Shirt,
  car: Car,
  box: Box,
  package: Package,
};

export const ICON_OPTIONS = Object.keys(ICONS);

export function iconLabel(key: string): string {
  return key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CategoryIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const Icon = ICONS[icon] ?? Package;
  return <Icon className={className} aria-hidden="true" />;
}
