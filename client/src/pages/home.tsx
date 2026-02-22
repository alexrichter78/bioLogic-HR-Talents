import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Target, GitCompareArrows, Users, UserCircle } from "lucide-react";
import logoSrc from "@assets/bioLogic-Logo-Transparent_1771718118370.png";

function Header() {
  return (
    <header className="flex items-center justify-start gap-2 flex-wrap px-6 py-4" data-testid="header">
      <img src={logoSrc} alt="bioLogic Logo" className="h-8 w-auto" data-testid="logo" />
      <span className="text-sm text-muted-foreground font-light">RoleDynamics</span>
    </header>
  );
}

function HeroSection() {
  return (
    <div className="relative flex flex-col items-center justify-center py-16 px-6 text-center" data-testid="hero-section">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true" />
      <div className="relative z-10">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground/90 mb-3" data-testid="text-title">
          bioLogic - RoleFit+
        </h1>
        <p className="text-muted-foreground text-base" data-testid="text-subtitle">
          Präzision in Besetzung und Teamstruktur
        </p>
      </div>
    </div>
  );
}

function ProfileCard() {
  return (
    <Card className="mx-auto max-w-md w-full p-6 text-center bg-white/60 dark:bg-card/60 backdrop-blur-sm border-card-border" data-testid="card-profile">
      <div className="flex flex-col items-center gap-3">
        <UserCircle className="w-10 h-10 text-muted-foreground/50" strokeWidth={1.5} />
        <h2 className="text-lg font-semibold text-foreground/90" data-testid="text-no-profile">
          Kein Profil geladen
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-profile-desc">
          Laden Sie ein bestehendes Profil oder starten Sie eine neue Analyse.
        </p>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <Button className="min-w-[180px]" data-testid="button-neues-profil">
            Neues Profil anlegen
          </Button>
          <Button className="min-w-[180px]" data-testid="button-profil-laden">
            Profil laden
          </Button>
        </div>
      </div>
    </Card>
  );
}

const features = [
  {
    icon: Briefcase,
    title: "JobCheck",
    description: "Tätigkeiten und Kompetenzen definieren",
    detail: "Rolle strukturell erfassen",
  },
  {
    icon: Target,
    title: "Sollprofil",
    description: "Zielstruktur der Rolle festlegen",
    detail: "Strategische Ausrichtung bestimmen",
  },
  {
    icon: GitCompareArrows,
    title: "Soll - Ist Vergleich",
    description: "Strukturanalyse mit der besetzten Person abgleichen",
    detail: "Überschneidungen erkennen\n→ Abweichungen erkennen",
  },
  {
    icon: Users,
    title: "Teamanalyse",
    description: "Strukturelle Diversität und Dynamik im Team analysieren",
    detail: "Stärken und Balance identifizieren",
  },
];

function FeatureCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto w-full auto-rows-fr" data-testid="feature-cards">
      {features.map((feature, index) => (
        <Card
          key={feature.title}
          className="p-5 bg-white/50 dark:bg-card/50 backdrop-blur-sm border-card-border hover-elevate cursor-pointer transition-all duration-200 h-full"
          data-testid={`card-feature-${index}`}
        >
          <div className="flex items-start gap-3">
            <feature.icon className="w-5 h-5 text-muted-foreground/60 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
            <div className="flex flex-col gap-1.5">
              <h3 className="text-sm font-semibold text-foreground/90" data-testid={`text-feature-title-${index}`}>
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                {feature.description}
              </p>
              <p className="text-xs text-muted-foreground/70 leading-relaxed whitespace-pre-line">
                → {feature.detail}
              </p>
            </div>
          </div>
        </Card>
      ))}
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
