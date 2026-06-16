import { useListSongs, useGetStats } from "@workspace/api-client-react";
import { SongRow } from "@/components/song-row";
import { Input } from "@/components/ui/input";
import { Search, Music, Disc3, HardDrive } from "lucide-react";
import { useState } from "react";

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const { data: songs, isLoading } = useListSongs({ search });
  const { data: stats } = useGetStats();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">Library</h1>
        <p className="text-muted-foreground">Your personal offline collection.</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Music className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalSongs}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Songs</div>
            </div>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Disc3 className="w-6 h-6 text-accent" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalPlaylists}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Playlists</div>
            </div>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalSizeMb.toFixed(1)} MB</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Storage Used</div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input 
          placeholder="Search songs, artists..." 
          className="pl-10 bg-card border-border h-12 rounded-xl text-lg focus-visible:ring-primary"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Song List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-4 p-3 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="w-8 text-center">#</div>
          <div className="flex-1 ml-12">Title</div>
          <div className="hidden md:block w-32">Album</div>
          <div className="w-16 text-right">Time</div>
          <div className="w-8"></div>
        </div>

        <div className="p-2 space-y-1">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl animate-pulse">
                <div className="w-8 h-4 bg-muted rounded"></div>
                <div className="w-10 h-10 bg-muted rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            ))
          ) : !songs || songs.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
                <Music className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No music found</h3>
              <p className="text-muted-foreground max-w-sm">
                Your library is empty. Head over to the Downloads tab to add some tracks.
              </p>
            </div>
          ) : (
            songs.map((song, i) => (
              <SongRow key={song.id} song={song} queue={songs} index={i} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
