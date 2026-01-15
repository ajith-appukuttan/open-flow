import { useDraggable } from '@dnd-kit/core';
import {
  Type,
  AlignLeft,
  Hash,
  Mail,
  Lock,
  Calendar,
  Upload,
  ChevronDown,
  CheckSquare,
  ToggleLeft,
  Sliders,
  Heading,
  Minus,
  Square,
  Image,
  Send,
  X,
  List,
  Circle,
} from 'lucide-react';
import type { FormComponentType } from '../../types/workflow';

interface PaletteItem {
  type: FormComponentType;
  label: string;
  icon: React.ReactNode;
  category: 'input' | 'selection' | 'layout' | 'action';
}

const paletteItems: PaletteItem[] = [
  // Input Components
  { type: 'text', label: 'Text Input', icon: <Type size={14} />, category: 'input' },
  { type: 'textarea', label: 'Text Area', icon: <AlignLeft size={14} />, category: 'input' },
  { type: 'number', label: 'Number', icon: <Hash size={14} />, category: 'input' },
  { type: 'email', label: 'Email', icon: <Mail size={14} />, category: 'input' },
  { type: 'password', label: 'Password', icon: <Lock size={14} />, category: 'input' },
  { type: 'date', label: 'Date', icon: <Calendar size={14} />, category: 'input' },
  { type: 'file', label: 'File Upload', icon: <Upload size={14} />, category: 'input' },
  
  // Selection Components
  { type: 'select', label: 'Dropdown', icon: <ChevronDown size={14} />, category: 'selection' },
  { type: 'multiselect', label: 'Multi-Select', icon: <List size={14} />, category: 'selection' },
  { type: 'radio', label: 'Radio Group', icon: <Circle size={14} />, category: 'selection' },
  { type: 'checkbox', label: 'Checkbox', icon: <CheckSquare size={14} />, category: 'selection' },
  { type: 'toggle', label: 'Toggle', icon: <ToggleLeft size={14} />, category: 'selection' },
  { type: 'slider', label: 'Slider', icon: <Sliders size={14} />, category: 'selection' },
  
  // Layout Components
  { type: 'label', label: 'Label/Title', icon: <Heading size={14} />, category: 'layout' },
  { type: 'divider', label: 'Divider', icon: <Minus size={14} />, category: 'layout' },
  { type: 'card', label: 'Card/Section', icon: <Square size={14} />, category: 'layout' },
  { type: 'image', label: 'Image', icon: <Image size={14} />, category: 'layout' },
  
  // Action Components
  { type: 'submit', label: 'Submit', icon: <Send size={14} />, category: 'action' },
  { type: 'cancel', label: 'Cancel', icon: <X size={14} />, category: 'action' },
];

function DraggablePaletteItem({ item }: { item: PaletteItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing transition-all text-sm
        ${isDragging 
          ? 'opacity-50 bg-indigo-600/50' 
          : 'hover:bg-white/10 text-gray-300 hover:text-white'
        }`}
    >
      <span className="text-gray-400">{item.icon}</span>
      <span className="text-xs">{item.label}</span>
    </div>
  );
}

export default function ComponentPalette() {
  const categories = [
    { id: 'input', label: 'Input' },
    { id: 'selection', label: 'Selection' },
    { id: 'layout', label: 'Layout' },
    { id: 'action', label: 'Actions' },
  ];

  return (
    <div className="w-44 bg-panel-bg border-r border-panel-border overflow-y-auto">
      <div className="p-2">
        <p className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">Components</p>
        
        {categories.map((category) => (
          <div key={category.id} className="mb-3">
            <p className="text-xs text-gray-500 px-2 mb-1">{category.label}</p>
            <div className="space-y-0.5">
              {paletteItems
                .filter((item) => item.category === category.id)
                .map((item) => (
                  <DraggablePaletteItem key={item.type} item={item} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
