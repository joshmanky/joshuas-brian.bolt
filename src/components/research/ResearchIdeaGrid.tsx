// ResearchIdeaGrid: displays 6 AI-generated idea cards in a grid
import { Kanban, Sparkles } from 'lucide-react';
import Badge from '../ui/Badge';
import type { ResearchItem } from '../../types';

const HOOK_BADGE: Record<string, { label: string; color: string }> = {
  Identitaet: { label: 'Identitaet', color: 'bg-jb-ig/15 text-jb-ig' },
  Frage: { label: 'Frage', color: 'bg-jb-tt/15 text-jb-tt' },
  Zahlen: { label: 'Zahlen', color: 'bg-blue-500/15 text-blue-400' },
  Kontrast: { label: 'Kontrast', color: 'bg-jb-warning/15 text-jb-warning' },
  Statement: { label: 'Statement', color: 'bg-jb-accent/10 text-jb-accent' },
  identitaets_hook: { label: 'Identitaet', color: 'bg-jb-ig/15 text-jb-ig' },
  frage_hook: { label: 'Frage', color: 'bg-jb-tt/15 text-jb-tt' },
  zahlen_hook: { label: 'Zahlen', color: 'bg-blue-500/15 text-blue-400' },
  kontrast_hook: { label: 'Kontrast', color: 'bg-jb-warning/15 text-jb-warning' },
  statement_hook: { label: 'Statement', color: 'bg-jb-accent/10 text-jb-accent' },
};

const PLATFORM_BADGE: Record<string, { label: string; color: string }> = {
  instagram: { label: 'IG', color: 'bg-jb-ig/15 text-jb-ig' },
  tiktok: { label: 'TT', color: 'bg-jb-tt/15 text-jb-tt' },
  youtube: { label: 'YT', color: 'bg-jb-yt/15 text-jb-yt' },
};

interface Props {
  ideas: ResearchItem[];
  onAddToPipeline: (item: ResearchItem) => void;
  onGenerateScript: (item: ResearchItem) => void;
}

export default function ResearchIdeaGrid({ ideas, onAddToPipeline, onGenerateScript }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {ideas.slice(0, 6).map((idea) => {
        const hookInfo = HOOK_BADGE[idea.hook_type] || HOOK_BADGE.Statement;
        const platInfo = PLATFORM_BADGE[idea.platform] || PLATFORM_BADGE.instagram;
        const isPipelined = idea.status === 'in_pipeline';

        return (
          <div
            key={idea.id}
            className={`bg-jb-bg border rounded-xl p-4 transition-all duration-200 group ${
              isPipelined ? 'border-jb-accent/20 opacity-60' : 'border-jb-border hover:border-jb-border-light'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Badge color={hookInfo.color}>{hookInfo.label}</Badge>
              <Badge color={platInfo.color}>{platInfo.label}</Badge>
              {isPipelined && <Badge color="bg-jb-success/10 text-jb-success">In Pipeline</Badge>}
            </div>
            <h4 className="text-sm font-semibold text-jb-text leading-snug mb-4">{idea.title}</h4>
            {!isPipelined && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAddToPipeline(idea)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-jb-accent bg-jb-accent/10 hover:bg-jb-accent/20 transition-colors"
                >
                  <Kanban size={12} /> In Pipeline
                </button>
                <button
                  onClick={() => onGenerateScript(idea)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-jb-text-secondary bg-jb-card hover:bg-jb-card-hover border border-jb-border transition-colors"
                >
                  <Sparkles size={12} /> Script generieren
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
