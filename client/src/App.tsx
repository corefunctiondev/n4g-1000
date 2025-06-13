import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import TerminalOS from "@/pages/terminal-os";
import CDJInterface from "@/pages/cdj-interface";

function Router() {
  return (
    <Switch>
      <Route path="/" component={TerminalOS} />
      <Route path="/home" component={TerminalOS} />
      <Route path="/about" component={TerminalOS} />
      <Route path="/sets" component={TerminalOS} />
      <Route path="/podcasts" component={TerminalOS} />
      <Route path="/bookings" component={TerminalOS} />
      <Route path="/releases" component={TerminalOS} />
      <Route path="/mixes" component={TerminalOS} />
      <Route path="/contact" component={TerminalOS} />
      <Route path="/n4g-1000" component={CDJInterface} />
      <Route path="/admin" component={TerminalOS} />
      <Route>
        <TerminalOS />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
