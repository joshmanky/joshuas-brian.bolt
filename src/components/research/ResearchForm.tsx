// ResearchForm: manual idea input with hook type + platform dropdowns
import { useState } from 'react';
import { Plus } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

const HOOK_OPTIONS = [
  { value: 'Identitaet', label: 'Identitaet' },
  { value: 'Frage', label: 'Frage' },
  { value: 'Zahlen', label: 'Zahlen' },
  { value: 'Kontrast', label: 'Kontrast' },
  { value: 'Statement', label: 'Statement' },
];

const PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
];

interface Props {
  onSave: (title: string, hookType: string, platform: string) => Promise<void>;
}

export default function ResearchForm({ onSave }: Props) {
  const [title, setTitle] = useState('');
  const [hookType, setHookType] = useState('Statement');
  const [platform, setPlatform] = useState('instagram');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave(title.trim(), hookType, platform);
      setTitle('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Deine Content-Idee eingeben..."
        />
      </div>
      <div className="w-full sm:w-36">
        <Select options={HOOK_OPTIONS} value={hookType} onChange={(e) => setHookType(e.target.value)} />
      </div>
      <div className="w-full sm:w-36">
        <Select options={PLATFORM_OPTIONS} value={platform} onChange={(e) => setPlatform(e.target.value)} />
      </div>
      <Button
        variant="primary"
        icon={<Plus size={14} />}
        onClick={handleSubmit}
        loading={saving}
        disabled={!title.trim()}
      >
        Speichern
      </Button>
    </div>
  );
}
