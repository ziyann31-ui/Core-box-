import { Link, useLocation } from "wouter";
import { Music, Download, ListMusic, Home } from "lucide-react";
import { PlayerBar } from "./player-bar";
import React from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Library", icon: Home },
    { href: "/playlists", label: "Playlists", icon: ListMusic },
    { href: "/downloads", label: "Downloads", icon: Download },
  ];

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-card border-r border-border flex flex-col z-10 hidden md:flex">
        <div className="p-6 flex items-center gap-3 text-primary font-bold text-2xl tracking-tight">
          <div className="bg-primary/20 p-2 rounded-xl">
            <Music className="w-6 h-6 text-primary" />
          </div>
          Core Box
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    active
                      ? "bg-primary text-primary-foreground font-medium shadow-[0_0_20px_rgba(157,78,221,0.3)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pb-24 md:pb-24">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2 text-primary font-bold text-xl">
            <Music className="w-5 h-5" /> Core Box
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Nav Bottom */}
      <nav className="md:hidden fixed bottom-20 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-4 z-20">
        {navItems.map((item) => {
          const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Player Bar */}
      <PlayerBar />
    </div>
  );
}
