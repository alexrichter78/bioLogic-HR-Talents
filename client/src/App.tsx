import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import RollenDNA from "@/pages/rollen-dna";
import Analyse from "@/pages/analyse";
import Bericht from "@/pages/bericht";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/rollen-dna" component={RollenDNA} />
      <Route path="/analyse" component={Analyse} />
      <Route path="/bericht" component={Bericht} />
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
