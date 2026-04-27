import { Switch, Route } from "wouter";
import { Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { RegionProvider } from "@/lib/region";
import { TranslationProvider } from "@/lib/translations-context";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import HelpBot from "@/components/help-bot";
import { StatusFooter } from "@/components/global-nav";

const Admin = lazy(() => import("@/pages/admin"));
const RollenDNA = lazy(() => import("@/pages/rollen-dna"));
const Analyse = lazy(() => import("@/pages/analyse"));
const Rollenprofil = lazy(() => import("@/pages/rollenprofil"));
const JobCheck = lazy(() => import("@/pages/jobcheck"));
const KICoach = lazy(() => import("@/pages/ki-coach"));
const TeamCheck = lazy(() => import("@/pages/teamcheck"));
const SollIstBericht = lazy(() => import("@/pages/soll-ist-bericht"));
const TeamReport = lazy(() => import("@/pages/team-report"));
const TeamCheckReportV2 = lazy(() => import("@/pages/teamcheck-report-v2"));
const TeamCheckReportV3 = lazy(() => import("@/pages/teamcheck-report-v3"));
const TeamCheckReportV4 = lazy(() => import("@/pages/teamcheck-report-v4"));
const FirmaDashboard = lazy(() => import("@/pages/firma-dashboard"));
const Kurs = lazy(() => import("@/pages/kurs"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const Ubersetzung = lazy(() => import("@/pages/ubersetzung"));
const Impressum = lazy(() => import("@/pages/impressum"));
const Datenschutz = lazy(() => import("@/pages/datenschutz"));
const Disclaimer = lazy(() => import("@/pages/disclaimer"));

function PageFallback() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f5f7fb", fontFamily: "Inter, Arial, Helvetica, sans-serif", gap: 14 }}>
      <div className="bio-spinner" />
      <p style={{ color: "#8E8E93", fontSize: 13, fontWeight: 500 }}>Laden...</p>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f5f7fb", fontFamily: "Inter, Arial, Helvetica, sans-serif", gap: 14 }}>
        <div className="bio-spinner" />
        <p style={{ color: "#8E8E93", fontSize: 13, fontWeight: 500 }}>Laden...</p>
      </div>
    );
  }

  if (window.location.pathname === "/reset-password") {
    return (
      <Suspense fallback={<PageFallback />}>
        <ResetPassword />
      </Suspense>
    );
  }

  if (window.location.pathname === "/impressum") {
    return (
      <Suspense fallback={<PageFallback />}>
        <Impressum />
      </Suspense>
    );
  }

  if (window.location.pathname === "/datenschutz") {
    return (
      <Suspense fallback={<PageFallback />}>
        <Datenschutz />
      </Suspense>
    );
  }

  if (window.location.pathname === "/disclaimer") {
    return (
      <Suspense fallback={<PageFallback />}>
        <Disclaimer />
      </Suspense>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (user.coachOnly) {
    return (
      <Suspense fallback={<PageFallback />}>
        <Switch>
          <Route path="/ki-coach" component={KICoach} />
          <Route path="/impressum" component={Impressum} />
          <Route path="/datenschutz" component={Datenschutz} />
          <Route path="/disclaimer" component={Disclaimer} />
          <Route component={KICoach} />
        </Switch>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/admin" component={Admin} />
        <Route path="/rollen-dna" component={RollenDNA} />
        <Route path="/analyse" component={Analyse} />
        <Route path="/bericht" component={Rollenprofil} />
        <Route path="/jobcheck" component={JobCheck} />
        <Route path="/teamcheck" component={TeamCheck} />
        <Route path="/ki-coach" component={KICoach} />
        <Route path="/kurs" component={Kurs} />
        <Route path="/soll-ist" component={SollIstBericht} />
        <Route path="/team-report" component={TeamReport} />
        <Route path="/teamcheck-report-v2" component={TeamCheckReportV2} />
        <Route path="/teamcheck-report-v3" component={TeamCheckReportV3} />
        <Route path="/teamcheck-report-v4" component={TeamCheckReportV4} />
        <Route path="/firma-dashboard" component={FirmaDashboard} />
        <Route path="/ubersetzung" component={Ubersetzung} />
        <Route path="/impressum" component={Impressum} />
        <Route path="/datenschutz" component={Datenschutz} />
        <Route path="/disclaimer" component={Disclaimer} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <RegionProvider>
            <TranslationProvider>
              <Toaster />
              <AppRoutes />
              <StatusFooter />
              <HelpBot />
            </TranslationProvider>
          </RegionProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
