import { useState } from 'react';
import { Trash2, Plus, X, Info } from 'lucide-react';
import type { FormComponent, FormComponentOption } from '../../types/workflow';

interface ComponentEditorProps {
  component: FormComponent;
  onChange: (updates: Partial<FormComponent>) => void;
  onDelete: () => void;
}

const componentTypeLabels: Record<string, string> = {
  text: 'Text Input',
  textarea: 'Text Area',
  number: 'Number Input',
  email: 'Email Input',
  password: 'Password Input',
  date: 'Date Picker',
  file: 'File Upload',
  select: 'Dropdown',
  multiselect: 'Multi-Select',
  radio: 'Radio Group',
  checkbox: 'Checkbox',
  toggle: 'Toggle Switch',
  slider: 'Slider',
  label: 'Label/Heading',
  divider: 'Divider',
  card: 'Card/Section',
  image: 'Image',
  submit: 'Submit Button',
  cancel: 'Cancel Button',
};

export default function ComponentEditor({ component, onChange, onDelete }: ComponentEditorProps) {
  const [showVariableHelp, setShowVariableHelp] = useState(false);
  
  const hasOptions = ['select', 'multiselect', 'radio'].includes(component.type);
  const hasValidation = ['text', 'textarea', 'number', 'email', 'password', 'slider'].includes(component.type);
  const isInput = !['label', 'divider', 'image', 'submit', 'cancel', 'card'].includes(component.type);

  const handleAddOption = () => {
    const newOptions = [
      ...(component.options || []),
      { label: `Option ${(component.options?.length || 0) + 1}`, value: `option${(component.options?.length || 0) + 1}` },
    ];
    onChange({ options: newOptions });
  };

  const handleUpdateOption = (index: number, updates: Partial<FormComponentOption>) => {
    const newOptions = component.options?.map((opt, i) =>
      i === index ? { ...opt, ...updates } : opt
    );
    onChange({ options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = component.options?.filter((_, i) => i !== index);
    onChange({ options: newOptions });
  };

  return (
    <div className="w-64 bg-panel-bg border-l border-panel-border overflow-y-auto">
      <div className="p-3 border-b border-panel-border">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400 uppercase">Properties</p>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
            title="Delete component"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <p className="text-sm text-white mt-1">{componentTypeLabels[component.type]}</p>
      </div>

      <div className="p-3 space-y-4">
        {/* Label */}
        {component.type !== 'divider' && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Label</label>
            <input
              type="text"
              value={component.label || ''}
              onChange={(e) => onChange({ label: e.target.value })}
              className="w-full bg-canvas-bg border border-panel-border rounded px-2 py-1.5 text-sm text-gray-300"
              placeholder="Field label"
            />
          </div>
        )}

        {/* Field Name */}
        {isInput && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Field Name</label>
            <input
              type="text"
              value={component.name || ''}
              onChange={(e) => onChange({ name: e.target.value.replace(/\s+/g, '_') })}
              className="w-full bg-canvas-bg border border-panel-border rounded px-2 py-1.5 text-sm text-gray-300 font-mono"
              placeholder="field_name"
            />
            <p className="text-xs text-gray-500 mt-1">Used for data binding</p>
          </div>
        )}

        {/* Placeholder */}
        {['text', 'textarea', 'number', 'email', 'password'].includes(component.type) && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Placeholder</label>
            <input
              type="text"
              value={component.placeholder || ''}
              onChange={(e) => onChange({ placeholder: e.target.value })}
              className="w-full bg-canvas-bg border border-panel-border rounded px-2 py-1.5 text-sm text-gray-300"
              placeholder="Placeholder text"
            />
          </div>
        )}

        {/* Default Value */}
        {isInput && (
          <div>
            <div className="flex items-center gap-1 mb-1">
              <label className="text-xs text-gray-400">Default Value</label>
              <button
                onClick={() => setShowVariableHelp(!showVariableHelp)}
                className="text-gray-500 hover:text-gray-300"
              >
                <Info size={12} />
              </button>
            </div>
            <input
              type="text"
              value={component.defaultValue || ''}
              onChange={(e) => onChange({ defaultValue: e.target.value })}
              className="w-full bg-canvas-bg border border-panel-border rounded px-2 py-1.5 text-sm text-gray-300"
              placeholder="{{Node.response.field}}"
            />
            {showVariableHelp && (
              <div className="mt-2 p-2 bg-indigo-500/10 rounded text-xs text-gray-300">
                <p className="font-semibold mb-1">Variable Syntax:</p>
                <p className="font-mono text-indigo-300">{'{{NodeLabel.response.field}}'}</p>
                <p className="text-gray-400 mt-1">Pre-fill from previous step outputs</p>
              </div>
            )}
          </div>
        )}

        {/* Required */}
        {isInput && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required"
              checked={component.required || false}
              onChange={(e) => onChange({ required: e.target.checked })}
              className="rounded bg-canvas-bg border-panel-border text-indigo-500 focus:ring-indigo-500"
            />
            <label htmlFor="required" className="text-sm text-gray-300">Required field</label>
          </div>
        )}

        {/* Width */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Width</label>
          <div className="flex gap-2">
            <button
              onClick={() => onChange({ width: 'full' })}
              className={`flex-1 px-3 py-1.5 rounded text-sm transition-colors ${
                component.width === 'full' || !component.width
                  ? 'bg-indigo-600 text-white'
                  : 'bg-canvas-bg text-gray-400 hover:bg-white/10'
              }`}
            >
              Full
            </button>
            <button
              onClick={() => onChange({ width: 'half' })}
              className={`flex-1 px-3 py-1.5 rounded text-sm transition-colors ${
                component.width === 'half'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-canvas-bg text-gray-400 hover:bg-white/10'
              }`}
            >
              Half
            </button>
          </div>
        </div>

        {/* Options (for select, radio, etc.) */}
        {hasOptions && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-400">Options</label>
              <button
                onClick={handleAddOption}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus size={12} />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {component.options?.map((option, index) => (
                <div key={index} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => handleUpdateOption(index, { label: e.target.value })}
                    className="flex-1 bg-canvas-bg border border-panel-border rounded px-2 py-1 text-xs text-gray-300"
                    placeholder="Label"
                  />
                  <input
                    type="text"
                    value={option.value}
                    onChange={(e) => handleUpdateOption(index, { value: e.target.value })}
                    className="w-20 bg-canvas-bg border border-panel-border rounded px-2 py-1 text-xs text-gray-300 font-mono"
                    placeholder="value"
                  />
                  <button
                    onClick={() => handleRemoveOption(index)}
                    className="p-1 text-gray-500 hover:text-red-400"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation */}
        {hasValidation && (
          <div>
            <label className="block text-xs text-gray-400 mb-2">Validation</label>
            <div className="space-y-2">
              {component.type === 'slider' || component.type === 'number' ? (
                <>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Min</label>
                      <input
                        type="number"
                        value={component.validation?.min ?? ''}
                        onChange={(e) => onChange({
                          validation: { ...component.validation, min: e.target.value ? Number(e.target.value) : undefined }
                        })}
                        className="w-full bg-canvas-bg border border-panel-border rounded px-2 py-1 text-xs text-gray-300"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Max</label>
                      <input
                        type="number"
                        value={component.validation?.max ?? ''}
                        onChange={(e) => onChange({
                          validation: { ...component.validation, max: e.target.value ? Number(e.target.value) : undefined }
                        })}
                        className="w-full bg-canvas-bg border border-panel-border rounded px-2 py-1 text-xs text-gray-300"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Min Length</label>
                      <input
                        type="number"
                        value={component.validation?.minLength ?? ''}
                        onChange={(e) => onChange({
                          validation: { ...component.validation, minLength: e.target.value ? Number(e.target.value) : undefined }
                        })}
                        className="w-full bg-canvas-bg border border-panel-border rounded px-2 py-1 text-xs text-gray-300"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Max Length</label>
                      <input
                        type="number"
                        value={component.validation?.maxLength ?? ''}
                        onChange={(e) => onChange({
                          validation: { ...component.validation, maxLength: e.target.value ? Number(e.target.value) : undefined }
                        })}
                        className="w-full bg-canvas-bg border border-panel-border rounded px-2 py-1 text-xs text-gray-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Pattern (Regex)</label>
                    <input
                      type="text"
                      value={component.validation?.pattern ?? ''}
                      onChange={(e) => onChange({
                        validation: { ...component.validation, pattern: e.target.value || undefined }
                      })}
                      className="w-full bg-canvas-bg border border-panel-border rounded px-2 py-1 text-xs text-gray-300 font-mono"
                      placeholder="^[a-z]+$"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Image specific */}
        {component.type === 'image' && (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Image URL</label>
              <input
                type="text"
                value={component.src || ''}
                onChange={(e) => onChange({ src: e.target.value })}
                className="w-full bg-canvas-bg border border-panel-border rounded px-2 py-1.5 text-sm text-gray-300"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Alt Text</label>
              <input
                type="text"
                value={component.alt || ''}
                onChange={(e) => onChange({ alt: e.target.value })}
                className="w-full bg-canvas-bg border border-panel-border rounded px-2 py-1.5 text-sm text-gray-300"
                placeholder="Image description"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
