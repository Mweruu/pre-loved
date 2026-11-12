import Link from "next/link";
import { Home, Mail, MessageCircle, Phone } from "lucide-react";

import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { APP_NAME } from "@/lib/constants";

export async function Footer() {
  const [settings, categories] = await Promise.all([
    getSettings(),
    prisma.category
      .findMany({
        where: { active: true },
        orderBy: { orderIndex: "asc" },
        select: { name: true, slug: true },
        take: 5,
      })
      .catch(() => []),
  ]);

  return (
    <footer className="mt-16 bg-forest-900 text-forest-100">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-700 text-white">
              <Home className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-semibold text-white">
              Sokoni Nyumbani
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-forest-200">
            Kenya&apos;s marketplace for pre-owned household items. Moving,
            upgrading or decluttering? Give your home items a second life —
            and find quality pre-loved treasures near you.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-forest-300">
            Explore
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/marketplace" className="hover:text-white">
                Browse all items
              </Link>
            </li>
            <li>
              <Link href="/plans" className="hover:text-white">
                Seller subscriptions
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white">
                About us
              </Link>
            </li>
            <li>
              <Link href="/safety" className="hover:text-white">
                Safety &amp; security
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact &amp; help
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-forest-300">
            Popular categories
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {(categories.length
              ? categories
              : [
                  { name: "Furniture", slug: "furniture" },
                  { name: "Electronics", slug: "electronics" },
                  { name: "Kitchen Appliances", slug: "kitchen-appliances" },
                  { name: "Home Essentials", slug: "home-essentials" },
                ]
            ).map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/marketplace?category=${c.slug}`}
                  className="hover:text-white"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-forest-300">
            Support
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              <a
                href={`mailto:${settings.supportEmail}`}
                className="hover:text-white"
              >
                {settings.supportEmail}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{settings.supportPhone}</span>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <a
                href={`https://wa.me/${settings.supportWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                WhatsApp support
              </a>
            </li>
          </ul>
          <p className="mt-5 text-xs leading-relaxed text-forest-300">
            {APP_NAME} connects buyers and sellers. We do not guarantee
            items, sellers or transactions — always exercise caution.
          </p>
        </div>
      </div>

      <div className="border-t border-forest-800">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-forest-300 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. Built for Kenya 🇰🇪
          </p>
          <div className="flex items-center gap-4">
            <Link href="/safety" className="hover:text-white">
              Safety notice
            </Link>
            <Link href="/contact" className="hover:text-white">
              Report a problem
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
