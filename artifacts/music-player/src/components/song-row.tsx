import { useListSongs, useDeleteSong } from "@workspace/api-client-react";
import { usePlayer } from "@/hooks/use-player";
import { Play, MoreHorizontal, Trash, ListPlus, Music } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Song } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListSongsQueryKey } from "@workspace/api-client-react";

interface SongRowProps {
  song: Song;
  queue: Song[];
  index: number;
}

function formatTime(seconds: number | undefined | null) {
  if (!seconds || isNaN(seconds)) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SongRow({ song, queue, index }: SongRowProps) {
  const { currentSong, isPlaying, play, pause, resume } = usePlayer();
  const deleteSong = useDeleteSong();
  const queryClient = useQueryClient();

  const isCurrent = currentSong?.id === song.id;

  const handlePlay = () => {
    if (isCurrent) {
      isPlaying ? pause() : resume();
    } else {
      play(song, queue);
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this song?")) {
      deleteSong.mutate({ id: song.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSongsQueryKey() });
        }
      });
    }
  };

  return (
    <div 
      className={`group flex items-center gap-4 p-3 rounded-xl transition-all duration-200 hover:bg-muted/50 ${
        isCurrent ? "bg-primary/10 border border-primary/20" : "border border-transparent"
      }`}
    >
      <div className="w-8 text-center text-sm font-mono text-muted-foreground group-hover:hidden">
        {isCurrent && isPlaying ? (
          <div className="flex items-end justify-center gap-[2px] h-4">
            <div className="w-1 bg-primary animate-[bounce_1s_infinite] h-full"></div>
            <div className="w-1 bg-primary animate-[bounce_1.2s_infinite] h-3/4"></div>
            <div className="w-1 bg-primary animate-[bounce_0.8s_infinite] h-full"></div>
          </div>
        ) : (
          index + 1
        )}
      </div>
      
      <button 
        onClick={handlePlay}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/20 text-primary hidden group-hover:flex hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        {isCurrent && isPlaying ? <div className="w-3 h-3 bg-current" /> : <Play className="w-4 h-4 ml-1 fill-current" />}
      </button>

      <div className="w-10 h-10 rounded bg-secondary overflow-hidden flex-shrink-0 relative">
        {song.thumbnailUrl ? (
          <img src={song.thumbnailUrl} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className={`font-medium truncate ${isCurrent ? "text-primary" : "text-foreground"}`}>
          {song.title}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {song.artist}
        </div>
      </div>

      <div className="hidden md:block w-32 text-sm text-muted-foreground truncate">
        {song.album || "Unknown Album"}
      </div>

      <div className="w-16 text-right text-sm font-mono text-muted-foreground">
        {formatTime(song.duration)}
      </div>

      <div className="w-8 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border">
            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => {/* TODO: Add to playlist dialog */}}>
              <ListPlus className="w-4 h-4" /> Add to Playlist
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2 text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={handleDelete}>
              <Trash className="w-4 h-4" /> Delete Song
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
