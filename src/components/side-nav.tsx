"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  Flag,
  Home,
  Layers,
  Package,
  PlusCircle,
  Settings,
  ShieldCheck,
  Tags,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  package: Package,
  plus: PlusCircle,
  banknote: Banknote,
  user: User,
  shield: ShieldCheck,
  users: Users,
  tags: Tags,
  layers: Layers,
  flag: Flag,
  settings: Settings,
};

export interface SideNavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

/** Sidebar navigation used by the seller and admin dashboards. */
export function SideNav({ items }: { items: SideNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0" aria-label="Dashboard">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = ICONS[item.icon] ?? Package;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
              active
                ? "bg-forest-700 text-white shadow-soft"
                : "text-ink-700 hover:bg-forest-50 hover:text-forest-800"
            )}
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
