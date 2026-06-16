import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { PlayerProvider } from "@/hooks/use-player";

// Pages
import LibraryPage from "@/pages/library";
import DownloadsPage from "@/pages/downloads";
import PlaylistsPage from "@/pages/playlists";
import PlaylistDetailPage from "@/pages/playlist-detail";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={LibraryPage} />
        <Route path="/downloads" component={DownloadsPage} />
        <Route path="/playlists" component={PlaylistsPage} />
        <Route path="/playlists/:id" component={PlaylistDetailPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PlayerProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </PlayerProvider>
    </QueryClientProvider>
  );
}

export default App;
