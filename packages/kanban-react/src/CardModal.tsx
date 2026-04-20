import { useState, useEffect } from 'react';
import type { KanbanCard, KanbanLabel, LabelColor } from '@widgetkit/kanban';

const LABEL_COLORS: LabelColor[] = [
  'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray',
];

interface CardModalProps {
  card: KanbanCard;
  onClose: () => void;
  onUpdate: (updates: Partial<KanbanCard>) => void;
  onDelete: () => void;
}

export function CardModal({ card, onClose, onUpdate, onDelete }: CardModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? '');
  const [dueDate, setDueDate] = useState(card.dueDate ?? '');
  const [priority, setPriority] = useState<string>(card.priority ?? '');
  const [labels, setLabels] = useState<KanbanLabel[]>(card.labels ?? []);
  const [newLabelText, setNewLabelText] = useState('');
  const [newLabelColor, setNewLabelColor] = useState<LabelColor>('blue');

  function save() {
    onUpdate({
      title: title.trim() || card.title,
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      priority: (priority as KanbanCard['priority']) || undefined,
      labels: labels.length ? labels : undefined,
    });
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { save(); onClose(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  });

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) { save(); onClose(); }
  }

  function addLabel() {
    if (!newLabelText.trim()) return;
    setLabels(prev => [...prev, { text: newLabelText.trim(), color: newLabelColor }]);
    setNewLabelText('');
  }

  return (
    <div className="kn-modal-backdrop" onClick={handleBackdropClick}>
      <div className="kn-modal" role="dialog" aria-modal>
        <div className="kn-modal-header">
          <input
            className="kn-modal-title-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Card title"
          />
          <button className="kn-modal-close" onClick={() => { save(); onClose(); }} aria-label="Close">×</button>
        </div>

        <div className="kn-modal-body">
          <div>
            <label className="kn-modal-label">Description</label>
            <textarea
              className="kn-input kn-modal-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add a description…"
              rows={3}
            />
          </div>

          <div className="kn-modal-row">
            <div className="kn-modal-field">
              <label className="kn-modal-label">Priority</label>
              <select
                className="kn-input kn-modal-select"
                value={priority}
                onChange={e => setPriority(e.target.value)}
              >
                <option value="">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="kn-modal-field">
              <label className="kn-modal-label">Due date</label>
              <input
                className="kn-input"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="kn-modal-label">Labels</label>
            {labels.length > 0 && (
              <div className="kn-modal-labels">
                {labels.map((label, i) => (
                  <span key={i} className={`kn-label kn-label--${label.color}`}>
                    {label.text}
                    <button
                      className="kn-label-remove"
                      onClick={() => setLabels(prev => prev.filter((_, j) => j !== i))}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="kn-label-add">
              <input
                className="kn-input kn-label-add-input"
                placeholder="Label text"
                value={newLabelText}
                onChange={e => setNewLabelText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addLabel(); }}
              />
              <div className="kn-color-swatches">
                {LABEL_COLORS.map(color => (
                  <button
                    key={color}
                    className={`kn-color-swatch kn-color-swatch--${color}${newLabelColor === color ? ' active' : ''}`}
                    onClick={() => setNewLabelColor(color)}
                    aria-label={color}
                  />
                ))}
              </div>
              <button className="kn-btn kn-btn--primary kn-label-add-btn" onClick={addLabel}>
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="kn-modal-footer">
          <button className="kn-btn kn-btn--danger" onClick={() => { onDelete(); onClose(); }}>
            Delete card
          </button>
          <button className="kn-btn kn-btn--primary" onClick={() => { save(); onClose(); }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
