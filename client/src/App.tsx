import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import RollenDNA from "@/pages/rollen-dna";
import Analyse from "@/pages/analyse";
import Rollenprofil from "@/pages/rollenprofil";
import JobCheck from "@/pages/jobcheck";
import KICoach from "@/pages/ki-coach";
import TeamCheck from "@/pages/teamcheck";
import SollIstBericht from "@/pages/soll-ist-bericht";
import TeamReport from "@/pages/team-report";
import TeamCheckReportV2 from "@/pages/teamcheck-report-v2";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/rollen-dna" component={RollenDNA} />
      <Route path="/analyse" component={Analyse} />
      <Route path="/bericht" component={Rollenprofil} />
      <Route path="/jobcheck" component={JobCheck} />
      <Route path="/teamcheck" component={TeamCheck} />
      <Route path="/ki-coach" component={KICoach} />
      <Route path="/soll-ist" component={SollIstBericht} />
      <Route path="/team-report" component={TeamReport} />
      <Route path="/teamcheck-report-v2" component={TeamCheckReportV2} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
