import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CDJInterface from "@/pages/cdj-interface";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CDJInterface} />
      <Route path="/cdj" component={CDJInterface} />
      <Route>
        <div className="min-h-screen flex items-center justify-center bg-cdj-dark text-white">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
            <p className="text-gray-400">The page you're looking for doesn't exist.</p>
          </div>
        </div>
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
