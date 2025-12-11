import { Play, Pause, ChevronLeft, ChevronRight, Monitor, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TVSlide } from "@/components/TVSlide";
import { useAutoPlay } from "@/hooks/useAutoPlay";
import { tvSlides } from "@/data/tvSlides";
import logoGrupoFN from "@/assets/logo-grupofn.png";
import { Link } from "react-router-dom";

export default function TVPresentation() {
  const { currentSlide, isPlaying, nextSlide, previousSlide, goToSlide, togglePlay } = useAutoPlay({
    totalSlides: tvSlides.length,
    interval: 12000, // 12 segundos por slide
  });

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
      {/* Header com Logo - Glassmorphismo */}
      <header className="bg-sidebar-background/80 backdrop-blur-md border-b border-sidebar-border/50 px-6 py-3 flex items-center justify-between shadow-soft">
        <div className="flex items-center gap-3">
          <img src={logoGrupoFN} alt="Grupo FN" className="h-10" />
          <div className="border-l border-sidebar-border/50 pl-3">
            <h2 className="text-base font-semibold text-sidebar-foreground">Dashboard Executivo</h2>
            <p className="text-xs text-sidebar-foreground/70">Apresentação Automática</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button
              variant="outline"
              size="sm"
              className="bg-sidebar-accent/50 hover:bg-sidebar-accent/80 border-sidebar-border/50 text-sidebar-foreground"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              <span className="text-xs">Voltar ao Dashboard</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            <span className="text-xs text-sidebar-foreground">Modo TV</span>
          </div>
        </div>
      </header>

      {/* Slides Container */}
      <main className="flex-1 relative overflow-hidden">
        {tvSlides.map((slide, index) => (
          <TVSlide
            key={slide.id}
            title={slide.title}
            subtitle={slide.subtitle}
            isActive={currentSlide === index}
          >
            {slide.content}
          </TVSlide>
        ))}
      </main>

      {/* Footer com Controles - Glassmorphismo */}
      <footer className="fixed bottom-0 left-0 right-0 bg-sidebar-background/80 backdrop-blur-md border-t border-sidebar-border/50 px-6 py-3 shadow-hover z-50">
        <div className="flex items-center justify-between gap-8">
          {/* Nome da Página Atual - DESTAQUE */}
          <div className="flex items-center gap-3 min-w-[280px]">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <div>
              <p className="text-base font-bold text-primary">
                {tvSlides[currentSlide].title}
              </p>
              <p className="text-xs text-sidebar-foreground/70">
                {tvSlides[currentSlide].subtitle}
              </p>
            </div>
          </div>

          {/* Indicadores de Slide */}
          <div className="flex items-center gap-2">
            {tvSlides.map((slide, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-3 rounded-full transition-all duration-300 ${
                  currentSlide === index
                    ? "w-16 bg-primary shadow-hover"
                    : "w-3 bg-sidebar-foreground/60 hover:bg-sidebar-foreground/80 hover:w-6"
                }`}
                aria-label={`Ir para ${slide.title}`}
                title={slide.title}
              />
            ))}
          </div>

          {/* Controles de Navegação */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={previousSlide}
              className="bg-sidebar-accent/50 hover:bg-sidebar-accent/80 border-sidebar-border/50 text-sidebar-foreground h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={togglePlay}
              className="bg-primary/90 hover:bg-primary border-primary/50 text-primary-foreground h-8 w-8 shadow-medium"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="bg-sidebar-accent/50 hover:bg-sidebar-accent/80 border-sidebar-border/50 text-sidebar-foreground h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Info do Slide */}
          <div className="text-right min-w-[120px]">
            <p className="text-xs text-sidebar-foreground font-medium">
              {currentSlide + 1} / {tvSlides.length}
            </p>
            <p className="text-xs text-sidebar-foreground/70">
              {isPlaying ? "⏵ Automático" : "⏸ Pausado"}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
