// BrainPage: knowledge base with upload, search, and AI content generation
import { useState, useEffect, useRef } from 'react';
import { Brain, Upload, Search, Sparkles, FileText, Quote, Lightbulb, X } from 'lucide-react';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getAllDocuments, uploadDocument, searchBrain, generateContentFromBrain } from '../services/brain';
import { formatDate } from '../lib/utils';
import type { BrainDocument } from '../types';

const CATEGORIES = [
  { value: 'Reel Script', label: 'Reel Script' },
  { value: 'Coaching Call', label: 'Coaching Call' },
  { value: 'Speech', label: 'Speech' },
  { value: 'Podcast', label: 'Podcast' },
  { value: 'Webinar', label: 'Webinar' },
];

export default function BrainPage() {
  const [documents, setDocuments] = useState<BrainDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('Reel Script');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState('');
  const [searching, setSearching] = useState(false);
  const [genResult, setGenResult] = useState('');
  const [generating, setGenerating] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<BrainDocument | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAllDocuments().then((d) => { setDocuments(d); setLoading(false); });
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.pdf')) {
      alert('Nur TXT und PDF Dateien werden unterstuetzt.');
      return;
    }
    setUploading(true);
    try {
      const doc = await uploadDocument(file, category);
      if (doc) setDocuments((prev) => [doc, ...prev]);
    } catch {
      // silent
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResult('');
    try {
      const result = await searchBrain(searchQuery.trim());
      setSearchResult(result);
    } catch {
      setSearchResult('Suche fehlgeschlagen.');
    } finally {
      setSearching(false);
    }
  };

  const handleGenerateContent = async () => {
    setGenerating(true);
    setGenResult('');
    try {
      const result = await generateContentFromBrain();
      setGenResult(result);
    } catch {
      setGenResult('Generierung fehlgeschlagen.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-jb-accent/10 flex items-center justify-center">
          <Brain size={20} className="text-jb-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-jb-text">Joshua Brain</h1>
          <p className="text-sm text-jb-text-secondary">Knowledge Base — {documents.length} Dokumente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div
            className={`bg-jb-card border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
              dragOver ? 'border-jb-accent bg-jb-accent/5' : 'border-jb-border hover:border-jb-border-light'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".txt,.pdf" className="hidden" onChange={(e) => handleUpload(e.target.files)} />
            <Upload size={24} className={`mx-auto mb-2 ${dragOver ? 'text-jb-accent' : 'text-jb-text-muted'}`} />
            {uploading ? (
              <p className="text-sm text-jb-accent">Wird hochgeladen und analysiert...</p>
            ) : (
              <>
                <p className="text-sm text-jb-text-secondary">TXT oder PDF Datei hierher ziehen oder klicken</p>
                <div className="flex items-center justify-center gap-3 mt-3">
                  <Select options={CATEGORIES} value={category} onChange={(e) => setCategory(e.target.value)} className="!w-auto" />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Brain durchsuchen..."
              className="flex-1 bg-jb-card border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 transition-colors"
            />
            <Button variant="secondary" icon={<Search size={14} />} onClick={handleSearch} loading={searching}>
              Suchen
            </Button>
          </div>

          {searchResult && (
            <div className="bg-jb-card border border-jb-accent/20 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-jb-accent mb-2 flex items-center gap-2">
                <Search size={14} /> Suchergebnis
              </h3>
              <p className="text-sm text-jb-text leading-relaxed whitespace-pre-wrap">{searchResult}</p>
            </div>
          )}

          <Button variant="secondary" icon={<Sparkles size={14} />} onClick={handleGenerateContent} loading={generating} className="w-full">
            Content aus Brain generieren
          </Button>

          {genResult && (
            <div className="bg-jb-card border border-jb-accent/20 rounded-xl p-5 accent-glow">
              <h3 className="text-sm font-semibold text-jb-accent mb-2 flex items-center gap-2">
                <Sparkles size={14} /> Generierte Content-Ideen
              </h3>
              <p className="text-sm text-jb-text leading-relaxed whitespace-pre-wrap">{genResult}</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-jb-text">Dokumente</h3>
          {documents.length === 0 ? (
            <p className="text-xs text-jb-text-muted py-4 text-center">Noch keine Dokumente hochgeladen.</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="w-full text-left bg-jb-card border border-jb-border rounded-lg p-3 hover:border-jb-border-light transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={13} className="text-jb-text-muted flex-shrink-0" />
                    <span className="text-xs font-medium text-jb-text truncate">{doc.filename}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{doc.category}</Badge>
                    <span className="text-[10px] text-jb-text-muted">{formatDate(doc.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-jb-text-muted">
                    <Quote size={10} /> {(doc.extracted_quotes as string[])?.length || 0} Zitate
                    <Lightbulb size={10} /> {(doc.extracted_insights as string[])?.length || 0} Insights
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedDoc(null)} />
          <div className="relative bg-jb-card border border-jb-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-jb-card border-b border-jb-border px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-semibold text-jb-text">{selectedDoc.filename}</h2>
                <Badge className="mt-1">{selectedDoc.category}</Badge>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="text-jb-text-muted hover:text-jb-text p-1">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {(selectedDoc.extracted_quotes as string[])?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-jb-accent mb-2 flex items-center gap-1">
                    <Quote size={12} /> Zitate
                  </h4>
                  <div className="space-y-2">
                    {(selectedDoc.extracted_quotes as string[]).map((q, i) => (
                      <p key={i} className="text-sm text-jb-text bg-jb-bg rounded-lg p-3 border-l-2 border-jb-accent/30 italic">
                        "{q}"
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {(selectedDoc.extracted_insights as string[])?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-jb-accent mb-2 flex items-center gap-1">
                    <Lightbulb size={12} /> Key Insights
                  </h4>
                  <div className="space-y-2">
                    {(selectedDoc.extracted_insights as string[]).map((ins, i) => (
                      <p key={i} className="text-sm text-jb-text bg-jb-bg rounded-lg p-3">
                        {ins}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
