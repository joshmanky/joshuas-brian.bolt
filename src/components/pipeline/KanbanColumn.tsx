// KanbanColumn: droppable column in the Kanban board
// Updated: passes onUpdated to KanbanCard for inline performance form
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';
import type { PipelineCard } from '../../types';

interface KanbanColumnProps {
  id: string;
  title: string;
  cards: PipelineCard[];
  mediaThumbnails: Record<string, string>;
  onGenerateScript: (card: PipelineCard) => void;
  onDelete: (id: string) => void;
  onCardClick: (card: PipelineCard) => void;
  onUpdated?: () => void;
}

export default function KanbanColumn({ id, title, cards, mediaThumbnails, onGenerateScript, onDelete, onCardClick, onUpdated }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={`flex-shrink-0 w-[260px] sm:w-[280px] bg-jb-card border rounded-xl flex flex-col max-h-[calc(100vh-220px)] transition-colors ${
        isOver ? 'border-jb-accent/40' : 'border-jb-border'
      }`}
    >
      <div className="px-3 py-3 border-b border-jb-border flex items-center justify-between flex-shrink-0">
        <h3 className="text-xs font-semibold text-jb-text uppercase tracking-wider">{title}</h3>
        <span className="stat-number text-[11px] text-jb-text-muted bg-jb-bg px-1.5 py-0.5 rounded">
          {cards.length}
        </span>
      </div>
      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[60px]">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              mediaThumbnail={card.media_id ? mediaThumbnails[card.media_id] : undefined}
              onGenerateScript={onGenerateScript}
              onDelete={onDelete}
              onClick={onCardClick}
              onUpdated={onUpdated}
            />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div className="py-6 text-center text-[11px] text-jb-text-muted">
            Leer
          </div>
        )}
      </div>
    </div>
  );
}
