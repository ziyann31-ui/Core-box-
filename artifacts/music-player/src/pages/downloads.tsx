import { useListDownloads, useCreateDownload, useCancelDownload } from "@workspace/api-client-react";
import { useState, useRef } from "react";
import { Download, Plus, AlertCircle, CheckCircle2, Loader2, X, ListPlus, Music, Upload, FileSpreadsheet, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getListDownloadsQueryKey, getGetStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type Mode = "single" | "batch" | "spotify";

export default function DownloadsPage() {
  const [query, setQuery] = useState("");
  const [queries, setQueries] = useState("");
  const [mode, setMode] = useState<Mode>("single");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ queued: number; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: downloads } = useListDownloads({
    query: { refetchInterval: 2000 }
  });

  const createDownload = useCreateDownload();
  const cancelDownload = useCancelDownload();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListDownloadsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
  };

  const handleDownload = () => {
    if (mode === "single" && query.trim()) {
      createDownload.mutate({ data: { query: query.trim() } }, {
        onSuccess: () => { setQuery(""); invalidate(); }
      });
    } else if (mode === "batch" && queries.trim()) {
      const list = queries.split("\n").map(q => q.trim()).filter(Boolean);
      if (list.length > 0) {
        createDownload.mutate({ data: { queries: list } }, {
          onSuccess: () => { setQueries(""); invalidate(); }
        });
      }
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", csvFile);
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/imports/spotify-csv`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setImportResult(data);
      setCsvFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      invalidate();
      toast({ title: `${data.queued} songs queued!`, description: "Songs are downloading in the background." });
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const handleCancel = (id: number) => {
    cancelDownload.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDownloadsQueryKey() })
    });
  };

  const tabs: { key: Mode; label: string }[] = [
    { key: "single", label: "Single Song" },
    { key: "batch", label: "Bulk Paste" },
    { key: "spotify", label: "Spotify CSV Import" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Downloads</h1>
        <p className="text-muted-foreground">Add new music to your offline library.</p>
      </div>

      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

        <div className="flex gap-1 border-b border-border pb-0 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setMode(tab.key)}
              className={`font-semibold px-4 pb-4 pt-1 -mb-[1px] whitespace-nowrap transition-colors border-b-2 ${
                mode === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pt-2">
          {mode === "single" && (
            <div className="flex gap-3">
              <Input
                placeholder="Song name or YouTube URL..."
                className="h-12 bg-background border-border text-base"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleDownload()}
                data-testid="input-single-query"
              />
              <Button
                onClick={handleDownload}
                className="h-12 px-6 font-bold shadow-[0_0_15px_rgba(157,78,221,0.3)] hover:shadow-[0_0_25px_rgba(157,78,221,0.5)]"
                disabled={!query.trim() || createDownload.isPending}
                data-testid="button-download-single"
              >
                {createDownload.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                Download
              </Button>
            </div>
          )}

          {mode === "batch" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Paste song names, one per line. Example: <span className="font-mono text-foreground">Tum Hi Ho Arijit Singh</span></p>
              <Textarea
                placeholder={"Tum Hi Ho Arijit Singh\nShayad Arijit Singh\nBekhayali Sachet Tandon\n..."}
                className="min-h-[180px] bg-background border-border text-base resize-y font-mono"
                value={queries}
                onChange={e => setQueries(e.target.value)}
                data-testid="textarea-batch-queries"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {queries.trim() ? `${queries.split("\n").filter(l => l.trim()).length} songs` : "No songs yet"}
                </span>
                <Button
                  onClick={handleDownload}
                  className="h-11 px-6 font-bold shadow-[0_0_15px_rgba(157,78,221,0.3)]"
                  disabled={!queries.trim() || createDownload.isPending}
                  data-testid="button-download-batch"
                >
                  {createDownload.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ListPlus className="w-5 h-5 mr-2" />}
                  Download All
                </Button>
              </div>
            </div>
          )}

          {mode === "spotify" && (
            <div className="space-y-5">
              {/* Step guide */}
              <div className="bg-background/60 border border-border rounded-xl p-4 space-y-3">
                <p className="font-semibold text-sm text-foreground">Apni Spotify Liked Songs import karne ke steps:</p>
                <ol className="space-y-2 text-sm text-muted-foreground list-none">
                  {[
                    { n: "1", text: "Neeche diye link pe jao — Exportify (free, safe)", link: "https://exportify.net", label: "exportify.net kholo" },
                    { n: "2", text: "Apne Spotify account se login karo" },
                    { n: "3", text: '"Liked Songs" ke saamne "Export" button dabao — CSV download hoga' },
                    { n: "4", text: "Woh CSV file yahan upload karo" },
                  ].map(step => (
                    <li key={step.n} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center mt-0.5">{step.n}</span>
                      <span>
                        {step.text}
                        {step.link && (
                          <a
                            href={step.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 inline-flex items-center gap-1 text-primary font-medium hover:underline"
                          >
                            {step.label} <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* File upload area */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                  csvFile ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-primary/5"
                }`}
                onClick={() => fileInputRef.current?.click()}
                data-testid="drop-zone-csv"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={e => setCsvFile(e.target.files?.[0] || null)}
                  data-testid="input-csv-file"
                />
                {csvFile ? (
                  <>
                    <FileSpreadsheet className="w-10 h-10 text-primary" />
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{csvFile.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {(csvFile.size / 1024).toFixed(1)} KB — Click to change
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-foreground" />
                    <div className="text-center">
                      <p className="font-semibold text-foreground">CSV file yahan drop karo</p>
                      <p className="text-sm text-muted-foreground mt-1">ya click karo file choose karne ke liye</p>
                    </div>
                  </>
                )}
              </div>

              {importResult && (
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <p className="text-sm font-medium text-green-400">{importResult.message} — Downloads tab mein progress dekho!</p>
                </div>
              )}

              <Button
                onClick={handleCsvImport}
                className="w-full h-12 font-bold shadow-[0_0_15px_rgba(157,78,221,0.3)] hover:shadow-[0_0_25px_rgba(157,78,221,0.5)]"
                disabled={!csvFile || importing}
                data-testid="button-import-csv"
              >
                {importing ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Importing...</>
                ) : (
                  <><Upload className="w-5 h-5 mr-2" /> Import Liked Songs</>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Download queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-tight">Active & Recent</h3>
          {downloads && downloads.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {downloads.filter(d => d.status === "done").length}/{downloads.length} complete
            </span>
          )}
        </div>
        <div className="grid gap-3">
          {!downloads || downloads.length === 0 ? (
            <div className="p-10 text-center bg-card border border-border rounded-xl">
              <Music className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground font-medium">Koi active download nahi.</p>
              <p className="text-sm text-muted-foreground mt-1 opacity-70">Upar se song add karo ya Spotify CSV import karo.</p>
            </div>
          ) : (
            downloads.map(job => (
              <div key={job.id} className="bg-card border border-border p-4 rounded-xl flex items-center gap-4 group transition-all" data-testid={`card-download-${job.id}`}>
                <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0 relative flex items-center justify-center">
                  {job.thumbnailUrl ? (
                    <img src={job.thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover opacity-50" />
                  ) : (
                    <Music className="w-6 h-6 text-muted-foreground" />
                  )}
                  {job.status === "downloading" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </div>
                  )}
                  {job.status === "done" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                  )}
                  {job.status === "failed" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-destructive/20">
                      <AlertCircle className="w-6 h-6 text-destructive" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate text-foreground">
                    {job.title || job.query}
                  </div>
                  {job.artist && job.status !== "pending" && (
                    <div className="text-xs text-muted-foreground truncate">{job.artist}</div>
                  )}
                  {job.status === "downloading" ? (
                    <div className="flex items-center gap-3 mt-2">
                      <Progress value={job.progress || 0} className="h-1.5 flex-1" />
                      <span className="text-xs font-mono text-muted-foreground w-10 text-right">
                        {Math.round(job.progress || 0)}%
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground mt-0.5 truncate">
                      {job.status === "done" ? (
                        <span className="text-green-400 text-xs font-medium">Downloaded</span>
                      ) : job.status === "failed" ? (
                        <span className="text-destructive text-xs">{job.error || "Failed"}</span>
                      ) : (
                        <span className="text-xs">Queue mein hai...</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-10 flex justify-end">
                  {job.status !== "done" && (
                    <button
                      onClick={() => handleCancel(job.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      title="Cancel"
                      data-testid={`button-cancel-download-${job.id}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
