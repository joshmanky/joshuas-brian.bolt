// GenerateForm: input form for generating a new lightbulb edition via Claude
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { LIGHTBULB_CATEGORIES } from '../../services/lightbulb';

interface Props {
  onGenerate: (thema: string, quelle: string, gedanke: string, kategorie: string) => void;
  loading: boolean;
}

const CATEGORY_OPTIONS = LIGHTBULB_CATEGORIES.map((c) => ({ value: c, label: c }));

export default function GenerateForm({ onGenerate, loading }: Props) {
  const [thema, setThema] = useState('');
  const [quelle, setQuelle] = useState('');
  const [gedanke, setGedanke] = useState('');
  const [kategorie, setKategorie] = useState('Mindset');

  function handleSubmit() {
    if (!thema.trim()) return;
    onGenerate(thema.trim(), quelle.trim(), gedanke.trim(), kategorie);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Thema des Tages"
          value={thema}
          onChange={(e) => setThema(e.target.value)}
          placeholder="z.B. Identitaet vor Strategie"
        />
        <Input
          label="Quelle / Inspiration"
          value={quelle}
          onChange={(e) => setQuelle(e.target.value)}
          placeholder="z.B. Buch: Die 1% Methode, Kapitel 3"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-jb-text-secondary mb-1.5 uppercase tracking-wider">
          Roher Gedanke oder Zitat
        </label>
        <textarea
          value={gedanke}
          onChange={(e) => setGedanke(e.target.value)}
          rows={4}
          placeholder="Paste ein Zitat, Highlight, oder deinen rohen Gedanken..."
          className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 focus:ring-1 focus:ring-jb-accent/20 transition-colors resize-none"
        />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="sm:w-56">
          <Select
            label="Kategorie"
            options={CATEGORY_OPTIONS}
            value={kategorie}
            onChange={(e) => setKategorie(e.target.value)}
          />
        </div>
        <Button
          variant="primary"
          icon={<Sparkles size={14} />}
          onClick={handleSubmit}
          loading={loading}
          disabled={!thema.trim()}
        >
          Lightbulb generieren
        </Button>
      </div>
    </div>
  );
}
