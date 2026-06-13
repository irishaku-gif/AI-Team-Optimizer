import React from "react";
import { Link, useLocation } from "wouter";
import { Users, LayoutDashboard, History, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Панель", icon: LayoutDashboard },
    { href: "/employees", label: "Сотрудники", icon: Users },
    { href: "/recommend", label: "Подбор команды", icon: Zap },
    { href: "/history", label: "История", icon: History },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden w-64 md:flex md:flex-col bg-sidebar border-r border-sidebar-border">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-sidebar-foreground">ИИ-оптимизатор</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 mt-auto">
          <div className="p-4 rounded-xl bg-sidebar-accent/50 border border-sidebar-border/50">
            <p className="text-xs text-sidebar-foreground/70 mb-2">На базе ИИ</p>
            <p className="text-xs font-medium text-sidebar-foreground">Умный подбор включён</p>
          </div>
        </div>
      </div>
      
      <main className="flex-1 overflow-y-auto w-full relative">
        <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-10 w-full min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
