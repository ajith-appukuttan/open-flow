import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
// Generate unique ID
const generateId = () => `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
import ComponentPalette from './ComponentPalette';
import FormCanvas from './FormCanvas';
import ComponentEditor from './ComponentEditor';
import type { FormComponent, FormConfig, FormComponentType } from '../../types/workflow';
import { Maximize2, Minimize2, Eye } from 'lucide-react';

interface FormBuilderProps {
  config: FormConfig;
  onChange: (config: FormConfig) => void;
}

const defaultComponentData: Partial<Record<FormComponentType, Partial<FormComponent>>> = {
  text: { label: 'Text Field', placeholder: 'Enter text...', width: 'full' },
  textarea: { label: 'Text Area', placeholder: 'Enter text...', width: 'full' },
  number: { label: 'Number', placeholder: '0', width: 'half' },
  email: { label: 'Email', placeholder: 'email@example.com', width: 'full' },
  password: { label: 'Password', placeholder: '••••••••', width: 'full' },
  date: { label: 'Date', width: 'half' },
  file: { label: 'File Upload', width: 'full' },
  select: { label: 'Dropdown', options: [{ label: 'Option 1', value: 'option1' }], width: 'full' },
  multiselect: { label: 'Multi-Select', options: [{ label: 'Option 1', value: 'option1' }], width: 'full' },
  radio: { label: 'Radio Group', options: [{ label: 'Option 1', value: 'option1' }], width: 'full' },
  checkbox: { label: 'Checkbox', width: 'half' },
  toggle: { label: 'Toggle', width: 'half' },
  slider: { label: 'Slider', validation: { min: 0, max: 100 }, width: 'full' },
  label: { label: 'Section Title', width: 'full' },
  divider: { width: 'full' },
  image: { label: 'Image', src: '', alt: '', width: 'full' },
  submit: { label: 'Submit' },
  cancel: { label: 'Cancel' },
};

export default function FormBuilder({ config, onChange }: FormBuilderProps) {
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const selectedComponent = config.components.find((c) => c.id === selectedComponentId);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Check if dragging from palette (new component)
    if (active.id.toString().startsWith('palette-')) {
      const componentType = active.id.toString().replace('palette-', '') as FormComponentType;
      const newComponent: FormComponent = {
        id: generateId(),
        type: componentType,
        name: `field_${Date.now()}`,
        ...defaultComponentData[componentType],
      };

      // Find index to insert at
      const overIndex = config.components.findIndex((c) => c.id === over.id);
      const newComponents = [...config.components];
      
      if (overIndex >= 0) {
        newComponents.splice(overIndex, 0, newComponent);
      } else {
        newComponents.push(newComponent);
      }

      onChange({ ...config, components: newComponents });
      setSelectedComponentId(newComponent.id);
    } else {
      // Reordering existing components
      const oldIndex = config.components.findIndex((c) => c.id === active.id);
      const newIndex = config.components.findIndex((c) => c.id === over.id);

      if (oldIndex !== newIndex && oldIndex >= 0 && newIndex >= 0) {
        const newComponents = [...config.components];
        const [removed] = newComponents.splice(oldIndex, 1);
        newComponents.splice(newIndex, 0, removed);
        onChange({ ...config, components: newComponents });
      }
    }
  };

  const handleComponentUpdate = (componentId: string, updates: Partial<FormComponent>) => {
    const newComponents = config.components.map((c) =>
      c.id === componentId ? { ...c, ...updates } : c
    );
    onChange({ ...config, components: newComponents });
  };

  const handleComponentDelete = (componentId: string) => {
    const newComponents = config.components.filter((c) => c.id !== componentId);
    onChange({ ...config, components: newComponents });
    if (selectedComponentId === componentId) {
      setSelectedComponentId(null);
    }
  };

  const handleConfigUpdate = (updates: Partial<FormConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className={`flex flex-col bg-panel-bg ${isExpanded ? 'fixed inset-4 z-50 rounded-xl shadow-2xl' : 'h-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-panel-border">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white">Form Builder</h3>
          <input
            type="text"
            value={config.title || ''}
            onChange={(e) => handleConfigUpdate({ title: e.target.value })}
            placeholder="Form Title"
            className="bg-canvas-bg border border-panel-border rounded px-2 py-1 text-sm text-gray-300 w-40"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`p-2 rounded-lg transition-colors ${showPreview ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-gray-400'}`}
            title="Preview form"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400"
            title={isExpanded ? 'Minimize' : 'Maximize'}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex overflow-hidden">
          {/* Palette */}
          <ComponentPalette />

          {/* Form Canvas */}
          <div className="flex-1 overflow-y-auto p-4 bg-canvas-bg">
            <SortableContext
              items={config.components.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <FormCanvas
                components={config.components}
                selectedId={selectedComponentId}
                onSelect={setSelectedComponentId}
                onDelete={handleComponentDelete}
                showPreview={showPreview}
              />
            </SortableContext>
          </div>

          {/* Component Editor */}
          {selectedComponent && (
            <ComponentEditor
              component={selectedComponent}
              onChange={(updates) => handleComponentUpdate(selectedComponent.id, updates)}
              onDelete={() => handleComponentDelete(selectedComponent.id)}
            />
          )}
        </div>

        <DragOverlay>
          {activeId && activeId.startsWith('palette-') && (
            <div className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg shadow-lg opacity-90">
              {activeId.replace('palette-', '')}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
