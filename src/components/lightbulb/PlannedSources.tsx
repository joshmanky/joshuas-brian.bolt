// PlannedSources: static section showing future integration sources for lightbulb editions
import { BookOpen, FileText, MessageCircle, PenLine } from 'lucide-react';
import Badge from '../ui/Badge';

const SOURCES = [
  {
    name: 'Kindle Highlights',
    icon: BookOpen,
    description: 'Automatisch Highlights und Notizen aus deinen Kindle-Buechern importieren.',
    status: 'Coming Soon' as const,
  },
  {
    name: 'Notion',
    icon: FileText,
    description: 'Verbinde dein Notion und ziehe Gedanken aus deinen Datenbanken.',
    status: 'Coming Soon' as const,
  },
  {
    name: 'Telegram Bot',
    icon: MessageCircle,
    description: 'Sende Zitate und Gedanken per Telegram-Bot direkt ins Lab.',
    status: 'Coming Soon' as const,
  },
  {
    name: 'Manuelle Eingabe',
    icon: PenLine,
    description: 'Direkt oben im Generator eigene Gedanken und Zitate eingeben.',
    status: 'Active' as const,
  },
];

export default function PlannedSources() {
  return (
    <div className="bg-jb-card border border-jb-border rounded-xl p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-jb-text mb-1">Geplante Quellen</h3>
        <p className="text-xs text-jb-text-secondary">
          Verbinde deine Quellen fuer automatische taegliche Generierung.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SOURCES.map((source) => (
          <div
            key={source.name}
            className="bg-jb-bg border border-jb-border rounded-xl p-4 flex flex-col gap-3 hover:border-jb-border-light transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-jb-accent/10 flex items-center justify-center">
                <source.icon size={16} className="text-jb-accent" />
              </div>
              <Badge
                color={
                  source.status === 'Active'
                    ? 'bg-jb-success/15 text-jb-success'
                    : 'bg-jb-text-muted/15 text-jb-text-muted'
                }
              >
                {source.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-jb-text mb-0.5">{source.name}</p>
              <p className="text-[11px] text-jb-text-secondary leading-relaxed">{source.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
