import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import type { FormComponent } from '../../types/workflow';
import FormComponentRenderer from './FormComponentRenderer';

interface FormCanvasProps {
  components: FormComponent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  showPreview: boolean;
}

interface SortableComponentProps {
  component: FormComponent;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  showPreview: boolean;
}

function SortableComponent({ component, isSelected, onSelect, onDelete, showPreview }: SortableComponentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (showPreview) {
    return (
      <div className={`${component.width === 'half' ? 'w-1/2' : 'w-full'} p-1`}>
        <FormComponentRenderer component={component} preview />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative ${component.width === 'half' ? 'w-1/2' : 'w-full'} p-1
        ${isDragging ? 'opacity-50 z-50' : ''}`}
    >
      <div
        onClick={onSelect}
        className={`relative rounded-lg border-2 transition-all cursor-pointer
          ${isSelected 
            ? 'border-indigo-500 bg-indigo-500/10' 
            : 'border-transparent hover:border-white/20 bg-white/5'
          }`}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical size={14} className="text-gray-500" />
        </div>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-1 top-1 p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={12} />
        </button>

        {/* Component Preview */}
        <div className="pl-6 pr-6 py-2">
          <FormComponentRenderer component={component} />
        </div>
      </div>
    </div>
  );
}

export default function FormCanvas({ components, selectedId, onSelect, onDelete, showPreview }: FormCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'form-canvas',
  });

  if (components.length === 0) {
    return (
      <div
        ref={setNodeRef}
        className={`min-h-[300px] rounded-xl border-2 border-dashed flex items-center justify-center transition-colors
          ${isOver 
            ? 'border-indigo-500 bg-indigo-500/10' 
            : 'border-white/20 text-gray-500'
          }`}
      >
        <div className="text-center">
          <p className="text-sm">Drag components here</p>
          <p className="text-xs text-gray-600 mt-1">Build your form by adding components from the palette</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[300px] rounded-xl border-2 border-dashed p-2 transition-colors
        ${isOver ? 'border-indigo-500 bg-indigo-500/5' : 'border-transparent'}`}
    >
      <div className={`flex flex-wrap ${showPreview ? '' : '-m-1'}`}>
        {components.map((component) => (
          <SortableComponent
            key={component.id}
            component={component}
            isSelected={selectedId === component.id}
            onSelect={() => onSelect(component.id)}
            onDelete={() => onDelete(component.id)}
            showPreview={showPreview}
          />
        ))}
      </div>
    </div>
  );
}
