import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Target, GitCompareArrows, Users, UserCircle } from "lucide-react";

function Header() {
  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4" data-testid="header">
      <div className="flex items-center gap-2 flex-wrap" data-testid="logo">
        <div className="flex items-center gap-0.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
        </div>
        <span className="text-sm font-bold tracking-tight text-foreground/80">
          bio<span className="font-extrabold text-foreground">Logic</span>
        </span>
        <span className="text-sm text-muted-foreground font-light">RoleDynamics</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" data-testid="button-laden">
          Laden
        </Button>
        <Button variant="outline" size="sm" data-testid="button-speichern">
          Speichern
        </Button>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <div className="relative flex flex-col items-center justify-center py-16 px-6 text-center" data-testid="hero-section">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] rounded-full bg-gradient-to-br from-pink-200/40 via-rose-100/30 to-transparent blur-3xl" />
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[70%] rounded-full bg-gradient-to-bl from-blue-200/40 via-sky-100/30 to-transparent blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[60%] rounded-full bg-gradient-to-tr from-green-100/30 via-emerald-50/20 to-transparent blur-3xl" />
        <div className="absolute top-[10%] left-[30%] w-[30%] h-[50%] rounded-full bg-gradient-to-b from-amber-100/20 via-yellow-50/10 to-transparent blur-3xl" />
      </div>
      <div className="relative z-10">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground/90 mb-3" data-testid="text-title">
          Strukturanalyse
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
        <Button className="mt-2 px-6" data-testid="button-neue-analyse">
          Neue Analyse starten
        </Button>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto w-full" data-testid="feature-cards">
      {features.map((feature, index) => (
        <Card
          key={feature.title}
          className="p-5 bg-white/50 dark:bg-card/50 backdrop-blur-sm border-card-border hover-elevate cursor-pointer transition-all duration-200"
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
        <div className="absolute top-0 left-0 w-full h-[500px]">
          <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[90%] rounded-full bg-gradient-to-br from-pink-100/50 via-rose-50/30 to-transparent blur-[80px]" />
          <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[80%] rounded-full bg-gradient-to-bl from-blue-100/50 via-indigo-50/20 to-transparent blur-[80px]" />
          <div className="absolute bottom-0 left-[15%] w-[35%] h-[60%] rounded-full bg-gradient-to-tr from-green-100/40 via-teal-50/20 to-transparent blur-[80px]" />
          <div className="absolute top-[20%] left-[25%] w-[25%] h-[40%] rounded-full bg-gradient-to-b from-amber-50/30 to-transparent blur-[60px]" />
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
