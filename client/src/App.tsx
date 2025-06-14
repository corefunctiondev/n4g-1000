import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AudioFeedbackProvider } from "@/hooks/use-audio-feedback";
import TerminalOS from "@/pages/terminal-os";
import CDJInterface from "@/pages/cdj-interface";
import AdminLogin from "@/pages/admin-login";
import SimpleAdmin from "@/pages/simple-admin";
import { LiveAdmin } from "@/pages/live-admin";
import { AppWrapper } from "@/pages/app-wrapper";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AppWrapper} />
      <Route path="/home" component={TerminalOS} />
      <Route path="/sets" component={TerminalOS} />
      <Route path="/podcasts" component={TerminalOS} />
      <Route path="/bookings" component={TerminalOS} />
      <Route path="/releases" component={TerminalOS} />
      <Route path="/mixes" component={TerminalOS} />
      <Route path="/contact" component={TerminalOS} />
      <Route path="/n4g-1000" component={CDJInterface} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={LiveAdmin} />
      <Route path="/admin/simple" component={SimpleAdmin} />
      <Route path="/admin" component={AdminLogin} />
      <Route>
        <AppWrapper />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AudioFeedbackProvider>
          <div className="dark">
            <Toaster />
            <Router />
          </div>
        </AudioFeedbackProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
