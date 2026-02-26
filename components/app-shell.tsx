"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GraduationCap,
  Dumbbell,
  CheckSquare,
  Activity,
  Library,
  Settings,
  Bell,
  User,
  Focus,
  Layers,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Courses", href: "/course", icon: Layers },
  { name: "Learn", href: "/learn", icon: GraduationCap },
  { name: "Practice", href: "/practice", icon: Dumbbell },
  { name: "Assess", href: "/assess", icon: CheckSquare },
  { name: "Progress", href: "/progress", icon: Activity },
  { name: "Library", href: "/library", icon: Library },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-stone-50 text-stone-900 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-stone-200 bg-white flex flex-col">
        <div className="p-6 border-b border-stone-100">
          <h1 className="text-xl font-semibold tracking-tight text-stone-800 flex items-center gap-2">
            <div className="w-6 h-6 bg-stone-800 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            Capability
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-stone-100 text-stone-900"
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-stone-700" : "text-stone-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-stone-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center">
              <User className="w-4 h-4 text-stone-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-900 truncate">Learner Profile</p>
              <p className="text-xs text-stone-500 truncate">Lvl 4 Engineer</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-stone-200 bg-white flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            {/* Breadcrumb placeholder */}
            <div className="text-sm font-medium text-stone-500">
              {pathname === "/" ? "Capability Control Room" : pathname.slice(1).charAt(0).toUpperCase() + pathname.slice(2)}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 text-sm font-medium hover:bg-stone-200 transition-colors">
              <Focus className="w-4 h-4" />
              Focus Mode
            </button>
            <button className="relative p-2 text-stone-400 hover:text-stone-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
