import { useListPlaylists, useCreatePlaylist, useDeletePlaylist } from "@workspace/api-client-react";
import { useState } from "react";
import { ListMusic, Plus, Trash2, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { getListPlaylistsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function PlaylistsPage() {
  const { data: playlists, isLoading } = useListPlaylists();
  const createPlaylist = useCreatePlaylist();
  const deletePlaylist = useDeletePlaylist();
  const queryClient = useQueryClient();

  const [newPlaylistName, setNewPlaylistName] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    
    createPlaylist.mutate({ data: { name: newPlaylistName.trim() } }, {
      onSuccess: () => {
        setNewPlaylistName("");
        queryClient.invalidateQueries({ queryKey: getListPlaylistsQueryKey() });
      }
    });
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Delete this playlist?")) {
      deletePlaylist.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPlaylistsQueryKey() });
        }
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Playlists</h1>
        <p className="text-muted-foreground">Curate your perfect collection.</p>
      </div>

      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
        <form onSubmit={handleCreate} className="flex gap-3">
          <div className="relative flex-1">
            <FolderPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="New playlist name..." 
              className="pl-10 h-12 bg-background border-border text-base"
              value={newPlaylistName}
              onChange={e => setNewPlaylistName(e.target.value)}
            />
          </div>
          <Button 
            type="submit" 
            className="h-12 px-6 font-bold"
            disabled={!newPlaylistName.trim() || createPlaylist.isPending}
          >
            <Plus className="w-5 h-5 mr-2" /> Create
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-card border border-border aspect-square rounded-2xl p-6 flex flex-col justify-end animate-pulse">
              <div className="h-6 bg-muted rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </div>
          ))
        ) : !playlists || playlists.length === 0 ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
              <ListMusic className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No playlists yet</h3>
            <p className="text-muted-foreground max-w-sm">
              Create a playlist above to start organizing your music.
            </p>
          </div>
        ) : (
          playlists.map(playlist => (
            <Link key={playlist.id} href={`/playlists/${playlist.id}`} className="block group">
              <div className="bg-card border border-border aspect-square rounded-2xl p-6 flex flex-col relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-primary/50 group-hover:bg-primary/5">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex-1 flex justify-end items-start relative z-20">
                  <button 
                    onClick={(e) => handleDelete(e, playlist.id)}
                    className="w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/20 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="relative z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-4">
                    <ListMusic className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1 truncate">{playlist.name}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{playlist.songCount} {playlist.songCount === 1 ? 'song' : 'songs'}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
