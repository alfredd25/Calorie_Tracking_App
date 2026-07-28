"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/") return null;
  if (pathname?.startsWith("/log-meal/")) return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    router.push("/");
  };

  const links = [
    { href: "/welcome", label: "Home" },
    { href: "/log-meals", label: "Log" },
    { href: "/create-meal", label: "Create" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-md border-b border-border z-50">
      <div className="max-w-2xl mx-auto h-full px-4 flex items-center justify-between">
        <Link href="/welcome" className="text-sm font-semibold tracking-tight text-foreground">
          NutriTrack
        </Link>

        <div className="flex items-center gap-6">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== "/welcome" && pathname?.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm transition-colors ${
                  active ? "text-foreground font-medium" : "text-muted hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            aria-label="Sign out"
            className="text-muted hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
