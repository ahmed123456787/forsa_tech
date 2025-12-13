import { Link, useLocation } from "react-router-dom";
import { Bot, Search, FileText, Package, History, Bell, User, LayoutDashboard, Home, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLanguage } from "@/hooks/useLanguage";
import atLogo from "@/assets/logo.svg";

export function Navbar() {
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { label: t('dashboard'), href: "/dashboard", icon: LayoutDashboard },
    { label: t('chatbot'), href: "/chat", icon: Bot },
    { label: t('search'), href: "/search", icon: Search },
    { label: t('conventions'), href: "/conventions", icon: FileText },
    { label: t('offers'), href: "/offers", icon: Package },
    { label: t('history'), href: "/history", icon: History },
  ];

  // Get current page title for breadcrumb
  const currentPage = navItems.find(item => item.href === location.pathname);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        {/* Left side - Logo + Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={atLogo} alt="Algérie Télécom" className="h-8 w-auto" />
          </Link>
          

        </div>

        {/* Center - Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1 bg-muted/30 rounded-full p-1 border border-border/50">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.href} to={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-1.5 h-8 px-3 rounded-full transition-all duration-200 text-xs font-medium",
                    isActive 
                      ? "bg-primary text-white shadow-sm hover:bg-primary/90" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex hover:bg-primary/10 hover:text-primary relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full p-0 ml-1">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#00a959] to-[#2c5eaa] flex items-center justify-center shadow-sm">
              <User className="h-3.5 w-3.5 text-white" />
            </div>
          </Button>
        </div>
      </div>
    </header>
  );
}
