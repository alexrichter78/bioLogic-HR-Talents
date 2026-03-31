import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { RegionProvider } from "@/lib/region";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Admin from "@/pages/admin";
import RollenDNA from "@/pages/rollen-dna";
import Analyse from "@/pages/analyse";
import Rollenprofil from "@/pages/rollenprofil";
import JobCheck from "@/pages/jobcheck";
import KICoach from "@/pages/ki-coach";
import TeamCheck from "@/pages/teamcheck";
import SollIstBericht from "@/pages/soll-ist-bericht";
import TeamReport from "@/pages/team-report";
import TeamCheckReportV2 from "@/pages/teamcheck-report-v2";
import TeamCheckReportV3 from "@/pages/teamcheck-report-v3";
import TeamCheckReportV4 from "@/pages/teamcheck-report-v4";
import Kurs from "@/pages/kurs";
import ResetPassword from "@/pages/reset-password";
import Impressum from "@/pages/impressum";
import Datenschutz from "@/pages/datenschutz";
import Disclaimer from "@/pages/disclaimer";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f7fb", fontFamily: "Inter, Arial, Helvetica, sans-serif" }}>
        <p style={{ color: "#8E8E93", fontSize: 14 }}>Laden...</p>
      </div>
    );
  }

  if (window.location.pathname === "/reset-password") {
    return <ResetPassword />;
  }

  if (window.location.pathname === "/impressum") {
    return <Impressum />;
  }

  if (window.location.pathname === "/datenschutz") {
    return <Datenschutz />;
  }

  if (window.location.pathname === "/disclaimer") {
    return <Disclaimer />;
  }

  if (!user) {
    return <Login />;
  }

  return (
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
      <Route path="/impressum" component={Impressum} />
      <Route path="/datenschutz" component={Datenschutz} />
      <Route path="/disclaimer" component={Disclaimer} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <RegionProvider>
            <Toaster />
            <AppRoutes />
          </RegionProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
