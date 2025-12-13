import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bot, ArrowRight, Sparkles, MessageCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThreeBackground } from "@/components/ThreeBackground";
import atLogo from "@/assets/logo.svg";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="h-screen bg-background relative overflow-hidden flex flex-col">
      {/* 3D Background */}
      <ThreeBackground />
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background/90 z-[1]" />
      
      {/* Minimal Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <img src={atLogo} alt="Algérie Télécom" className="h-10 w-auto" />
        </Link>
        
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="hidden sm:flex gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary">
              {t('dashboard')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo Badge */}
          <div className="flex justify-center mb-10">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00a959]/20 to-[#2c5eaa]/20 rounded-full blur-3xl scale-150" />
              <img src={atLogo} alt="Algérie Télécom" className="relative h-24 md:h-32 w-auto drop-shadow-2xl" />
            </div>
          </div>
          
          {/* AI Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{t('aiAssistant')}</span>
          </div>
          
          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight text-foreground tracking-tight">
            {t('heroTitle')} <span className="text-gradient-at">{t('heroTitleAI')}</span> {t('heroTitleOffers')}{" "}
            <span className="text-gradient-at">{t('heroTitleBrand')}</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-14 max-w-2xl mx-auto">
            {t('heroDescription')}
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/chat" className="group">
              <Button 
                size="lg" 
                className="relative gap-4 bg-gradient-to-r from-[#00a959] to-[#20b471] hover:from-[#00a959]/90 hover:to-[#20b471]/90 text-white px-12 py-8 text-xl font-semibold rounded-full shadow-2xl shadow-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_50px_rgba(0,169,89,0.4)] border-2 border-white/20"
              >
                {/* Animated pulse ring */}
                <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-20" />
                
                {/* Icon with background */}
                <span className="relative flex items-center justify-center h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
                  <MessageCircle className="h-5 w-5" />
                </span>
                
                <span className="relative">{t('startConversation')}</span>
                
                {/* Animated arrow */}
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 text-center py-4 text-xs text-muted-foreground shrink-0">
        © 2025 Algérie Télécom - {t('footerText')}
      </footer>
    </div>
  );
}
