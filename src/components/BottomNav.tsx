"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  match: (pathname: string) => boolean;
  icon: React.ReactNode;
};

function HomeIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill={color}>
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  );
}

function BalanceIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill={color}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.88 15.76V19h-1.75v-1.29c-1.41-.29-2.67-1.12-2.74-2.74h1.77c.07.76.62 1.35 1.97 1.35 1.43 0 1.75-.72 1.75-1.17 0-.61-.32-1.17-1.97-1.58-1.83-.46-3.08-1.25-3.08-2.8 0-1.31 1.05-2.16 2.3-2.43V7h1.75v1.34c1.49.35 2.24 1.42 2.29 2.74h-1.77c-.05-.8-.49-1.35-1.64-1.35-1.1 0-1.75.5-1.75 1.18 0 .59.46 1.01 1.97 1.4 1.51.39 3.08.99 3.08 2.99-.01 1.36-.98 2.22-2.39 2.46z" />
    </svg>
  );
}

function CreditIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill={color}>
      <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zM16.2 13H19v6h-2.8v-6z" />
    </svg>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill={color}>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "/",
    match: (p) => p === "/",
    icon: null, // filled in render
  },
  {
    label: "Balance",
    href: "/balance",
    match: (p) => p.startsWith("/balance") || p.startsWith("/transactions"),
    icon: null,
  },
  {
    label: "Credit",
    href: "/credit",
    match: (p) => p.startsWith("/credit"),
    icon: null,
  },
  {
    label: "Profile",
    href: "/profile",
    match: (p) => p.startsWith("/profile") || p.startsWith("/assistant"),
    icon: null,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-gray-200 flex">
      {NAV_ITEMS.map(({ label, href, match }) => {
        const active = match(pathname);
        const color = active ? "#F26522" : "#0D3B66";

        let icon: React.ReactNode;
        if (label === "Home") icon = <HomeIcon color={color} />;
        else if (label === "Balance") icon = <BalanceIcon color={color} />;
        else if (label === "Credit") icon = <CreditIcon color={color} />;
        else icon = <ProfileIcon color={color} />;

        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
          >
            {icon}
            <span
              className="text-[10px] font-medium"
              style={{ color }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
