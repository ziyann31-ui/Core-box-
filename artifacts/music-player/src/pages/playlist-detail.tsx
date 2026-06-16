import { useGetPlaylist, useRemoveSongFromPlaylist } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { SongRow } from "@/components/song-row";
import { ArrowLeft, ListMusic, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/hooks/use-player";

export default function PlaylistDetailPage() {
  const { id } = useParams();
  const playlistId = parseInt(id || "0", 10);
  
  const { data: playlist, isLoading } = useGetPlaylist(playlistId, { 
    query: { enabled: !!playlistId } 
  });
  
  const { play } = usePlayer();

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!playlist) {
    return <div className="p-8">Playlist not found</div>;
  }

  const handlePlayAll = () => {
    if (playlist.songs.length > 0) {
      play(playlist.songs[0], playlist.songs);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Link href="/playlists" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Playlists
      </Link>

      <div className="flex flex-col md:flex-row gap-8 items-end border-b border-border/50 pb-8">
        <div className="w-48 h-48 md:w-56 md:h-56 bg-card border border-border rounded-2xl flex items-center justify-center shadow-2xl flex-shrink-0">
          <ListMusic className="w-24 h-24 text-primary/20" />
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold tracking-wider text-primary uppercase">Playlist</h4>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">{playlist.name}</h1>
          </div>
          
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="font-mono">{playlist.songs.length} songs</span>
          </div>

          <div className="pt-4">
            <Button 
              size="lg" 
              onClick={handlePlayAll}
              disabled={playlist.songs.length === 0}
              className="rounded-full px-8 font-bold shadow-[0_0_20px_rgba(157,78,221,0.4)]"
            >
              <Play className="w-5 h-5 mr-2 fill-current" /> Play All
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-4 p-3 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="w-8 text-center">#</div>
          <div className="flex-1 ml-12">Title</div>
          <div className="hidden md:block w-32">Album</div>
          <div className="w-16 text-right">Time</div>
          <div className="w-8"></div>
        </div>

        <div className="p-2 space-y-1">
          {playlist.songs.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
                <ListMusic className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">Empty playlist</h3>
              <p className="text-muted-foreground max-w-sm">
                Go to the library and add songs to this playlist.
              </p>
            </div>
          ) : (
            playlist.songs.map((song, i) => (
              <SongRow key={song.id} song={song} queue={playlist.songs} index={i} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
