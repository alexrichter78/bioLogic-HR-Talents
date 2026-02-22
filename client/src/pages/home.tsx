import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dna, Target, GitCompareArrows, Users, Sparkles, ShieldCheck, PlusCircle, FolderOpen } from "lucide-react";
import { useLocation } from "wouter";
import logoSrc from "@assets/bioLogic-Logo-Transparent_1771718118370.png";

function Header() {
  return (
    <header className="flex items-center justify-start gap-2 flex-wrap px-6 py-4" data-testid="header">
      <img src={logoSrc} alt="bioLogic Logo" className="h-8 w-auto" data-testid="logo" />
    </header>
  );
}

function HeroSection() {
  return (
    <div className="relative flex flex-col items-center justify-center py-16 px-6 text-center" data-testid="hero-section">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true" />
      <div className="relative z-10">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground/90 mb-1" data-testid="text-title">
          RoleDNA
        </h1>
        <p className="text-xs text-muted-foreground/60 mb-4" data-testid="text-by-biologic">
          by bioLogic
        </p>
        <p className="text-muted-foreground text-base" data-testid="text-subtitle">
          Strukturelle Entscheidungen für Rolle, Persönlichkeit und Team(s).
        </p>
      </div>
    </div>
  );
}

function ProfileCard() {
  const [, setLocation] = useLocation();
  return (
    <Card className="mx-auto max-w-2xl w-full p-6 text-center bg-white/60 dark:bg-card/60 backdrop-blur-sm border-card-border" data-testid="card-profile">
      <div className="flex flex-col items-center gap-3">
        <Sparkles className="w-10 h-10 text-muted-foreground/50" strokeWidth={1.5} />
        <h2 className="text-lg font-semibold text-foreground/90" data-testid="text-no-profile">
          Starten Sie eine neue Analyse
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md" data-testid="text-profile-desc">
          Erstellen Sie eine Rollen-DNA und analysieren Sie strukturelle Passung sowie Entwicklungspotenzial auf Basis klarer Handlungsempfehlungen.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <Button className="flex-1 min-w-[180px] gap-2" data-testid="button-analyse-starten" onClick={() => setLocation("/rollen-dna")}>
            <PlusCircle className="w-4 h-4" />
            Neue Rollen-DNA erstellen
          </Button>
          <Button className="flex-1 min-w-[180px] gap-2" data-testid="button-analyse-oeffnen">
            <FolderOpen className="w-4 h-4" />
            Bestehende Analyse öffnen
          </Button>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="text-[11px] text-muted-foreground/50" data-testid="text-trust">
            Wissenschaftlich fundierte Methodik mit nachvollziehbarer Ergebnislogik
          </p>
        </div>
      </div>
    </Card>
  );
}

const features = [
  {
    icon: Dna,
    title: "Rollen-DNA definieren",
    description: "Tätigkeiten, Kompetenzen und Erfolgsfaktoren strukturiert erfassen.",
  },
  {
    icon: Target,
    title: "Zielprofil festlegen",
    description: "Persönlichkeitsstruktur bestimmen, die in dieser Rolle performt.",
  },
  {
    icon: GitCompareArrows,
    title: "Passung objektiv messen",
    description: "Abweichungen, Potenziale und Entwicklungsfelder sichtbar machen.",
  },
  {
    icon: Users,
    title: "Team-Dynamik analysieren",
    description: "Strukturelle Balance, Reibung und Ergänzungen im Team erkennen.",
  },
];

function FeatureCards() {
  const [, setLocation] = useLocation();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto w-full auto-rows-fr" data-testid="feature-cards">
      {features.map((feature, index) => {
        const isActive = index === 0;
        return (
          <Card
            key={feature.title}
            className={`p-5 backdrop-blur-sm border-card-border transition-all duration-200 h-full ${
              isActive
                ? "bg-white/50 dark:bg-card/50 hover-elevate cursor-pointer"
                : "bg-muted/40 dark:bg-muted/20 opacity-50 cursor-not-allowed select-none"
            }`}
            onClick={isActive ? () => setLocation("/rollen-dna") : undefined}
            data-testid={`card-feature-${index}`}
          >
            <div className="flex items-start gap-3">
              <feature.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isActive ? "text-muted-foreground/60" : "text-muted-foreground/30"}`} strokeWidth={1.5} />
              <div className="flex flex-col gap-1.5">
                <h3 className={`text-sm font-semibold ${isActive ? "text-foreground/90" : "text-foreground/40"}`} data-testid={`text-feature-title-${index}`}>
                  {feature.title}
                </h3>
                <p className={`text-xs leading-relaxed ${isActive ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                  {feature.description}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[600px]">
          <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[100%] rounded-full bg-gradient-to-br from-pink-300/60 via-rose-200/50 to-transparent blur-[100px]" />
          <div className="absolute top-[-15%] right-[-10%] w-[55%] h-[90%] rounded-full bg-gradient-to-bl from-blue-300/55 via-sky-200/45 to-transparent blur-[100px]" />
          <div className="absolute bottom-[-5%] left-[10%] w-[45%] h-[70%] rounded-full bg-gradient-to-tr from-green-200/50 via-emerald-100/35 to-transparent blur-[90px]" />
          <div className="absolute top-[15%] left-[20%] w-[35%] h-[50%] rounded-full bg-gradient-to-b from-amber-100/40 via-yellow-50/25 to-transparent blur-[70px]" />
        </div>
      </div>

      <div className="relative z-10">
        <Header />

        <HeroSection />

        <div className="px-6 pb-12 flex flex-col gap-8">
          <ProfileCard />
          <FeatureCards />
        </div>
      </div>
    </div>
  );
}
