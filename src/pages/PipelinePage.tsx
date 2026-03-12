// PipelinePage: Kanban board with drag-and-drop content pipeline
// Updated: new detail modal with caption/hashtags/canva/date; published auto-logs to ai_tasks_log
import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { Kanban, Plus } from 'lucide-react';
import KanbanColumn from '../components/pipeline/KanbanColumn';
import KanbanCard from '../components/pipeline/KanbanCard';
import PipelineDetailModal from '../components/pipeline/PipelineDetailModal';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getAllCards, createCard, deleteCard, moveCard, updateCard } from '../services/pipeline';
import { callClaude, logAiTask, SCRIPT_SYSTEM_PROMPT, CLAUDE_MODELS } from '../services/claude';
import { PIPELINE_COLUMNS, HOOK_TYPE_LABELS, PLATFORM_OPTIONS } from '../types';
import type { PipelineCard, PipelineStatus, HookType } from '../types';

export default function PipelinePage() {
  const [cards, setCards] = useState<PipelineCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailCard, setDetailCard] = useState<PipelineCard | null>(null);
  const [activeCard, setActiveCard] = useState<PipelineCard | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPlatform, setNewPlatform] = useState('instagram');
  const [newHookType, setNewHookType] = useState('statement_hook');
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const loadCards = useCallback(async () => {
    const data = await getAllCards();
    setCards(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadCards(); }, [loadCards]);

  const getColumnCards = (status: PipelineStatus) =>
    cards.filter((c) => c.status === status).sort((a, b) => a.position - b.position);

  const handleAddCard = async () => {
    if (!newTitle.trim()) return;
    await createCard({ title: newTitle.trim(), platform: newPlatform, hook_type: newHookType });
    setNewTitle('');
    setAddModalOpen(false);
    loadCards();
  };

  const handleDelete = async (id: string) => {
    await deleteCard(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
    if (detailCard?.id === id) setDetailCard(null);
  };

  const handleGenerateScript = async (card: PipelineCard) => {
    setGeneratingId(card.id);
    try {
      const hookLabel = HOOK_TYPE_LABELS[card.hook_type as HookType] || card.hook_type;
      const userMessage = `Erstelle ein virales Skript zum Thema: "${card.title}". Verwende einen ${hookLabel}. Formatiere klar mit den 5 Phasen: Hook, Situation, Emotion, Mehrwert/Loesung, CTA.`;
      const result = await callClaude(SCRIPT_SYSTEM_PROMPT, userMessage, CLAUDE_MODELS.SONNET, 1000, 'Pipeline Script Agent');
      await logAiTask('Pipeline Script Agent', 'pipeline_script_generation', result);
      await updateCard(card.id, { script_content: result, status: 'skript_fertig' });
      loadCards();
    } catch {} finally {
      setGeneratingId(null);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find((c) => c.id === event.active.id);
    if (card) setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const activeCardData = cards.find((c) => c.id === activeId);
    if (!activeCardData) return;

    const isOverColumn = PIPELINE_COLUMNS.some((col) => col.key === overId);
    if (isOverColumn) {
      if (activeCardData.status !== overId) {
        setCards((prev) => prev.map((c) => c.id === activeId ? { ...c, status: overId as PipelineStatus } : c));
      }
      return;
    }

    const overCard = cards.find((c) => c.id === overId);
    if (overCard && activeCardData.status !== overCard.status) {
      setCards((prev) => prev.map((c) => c.id === activeId ? { ...c, status: overCard.status } : c));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;
    const card = cards.find((c) => c.id === active.id);
    if (!card) return;

    const columnCards = getColumnCards(card.status);
    const position = columnCards.findIndex((c) => c.id === card.id);
    await moveCard(card.id, card.status, position >= 0 ? position : 0);

    if (card.status === 'published') {
      await logAiTask('Pipeline', 'content_published', `Post veroeffentlicht: ${card.title}`);
    }
  };

  function handleDetailUpdated() {
    loadCards();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-jb-accent/10 flex items-center justify-center">
            <Kanban size={20} className="text-jb-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-jb-text">Content Pipeline</h1>
            <p className="text-sm text-jb-text-secondary">{cards.length} Ideen im System</p>
          </div>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setAddModalOpen(true)}>
          Neue Idee
        </Button>
      </div>

      <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 min-w-min">
            {PIPELINE_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.key}
                id={col.key}
                title={col.label}
                cards={getColumnCards(col.key)}
                onGenerateScript={handleGenerateScript}
                onDelete={handleDelete}
                onCardClick={setDetailCard}
              />
            ))}
          </div>
          <DragOverlay>
            {activeCard && (
              <KanbanCard card={activeCard} onGenerateScript={() => {}} onDelete={() => {}} onClick={() => {}} />
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {generatingId && (
        <div className="fixed bottom-4 right-4 bg-jb-card border border-jb-accent/30 rounded-xl px-4 py-3 flex items-center gap-2 shadow-lg z-50">
          <div className="w-4 h-4 border-2 border-jb-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-jb-accent font-medium">Script wird generiert...</span>
        </div>
      )}

      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Neue Content-Idee">
        <div className="space-y-4">
          <Input label="Titel" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Content-Idee..." />
          <Select label="Plattform" options={PLATFORM_OPTIONS} value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} />
          <Select
            label="Hook-Typ"
            options={Object.entries(HOOK_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            value={newHookType}
            onChange={(e) => setNewHookType(e.target.value)}
          />
          <Button className="w-full" onClick={handleAddCard} disabled={!newTitle.trim()}>
            Idee hinzufuegen
          </Button>
        </div>
      </Modal>

      <PipelineDetailModal
        card={detailCard}
        onClose={() => setDetailCard(null)}
        onUpdated={handleDetailUpdated}
      />
    </div>
  );
}
