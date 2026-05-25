"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Utensils, LayoutDashboard, LogOut } from "lucide-react";

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

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm border-b border-border z-50 flex items-center justify-between px-6">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Utensils className="w-4 h-4 text-white" />
        </div>
        <span className="text-xl font-bold text-slate-900 tracking-tight">
          NutriTrack
        </span>
      </div>

      <div className="flex items-center space-x-6">
        <Link 
          href="/welcome" 
          className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/welcome' ? 'text-primary' : 'text-slate-500'}`}
        >
          Welcome
        </Link>
        <Link 
          href="/log-meals" 
          className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/log-meals' ? 'text-primary' : 'text-slate-500'}`}
        >
          Log Meals
        </Link>
        <Link
          href="/create-meal"
          className={`text-sm font-medium transition-colors hover:text-primary ${pathname?.startsWith('/create-meal') ? 'text-primary' : 'text-slate-500'}`}
        >
          Create Meal
        </Link>
        <Link 
          href="/dashboard" 
          className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/dashboard' ? 'text-primary' : 'text-slate-500'}`}
        >
          Dashboard
        </Link>
        
        <button 
          onClick={handleLogout}
          className="ml-4 p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
