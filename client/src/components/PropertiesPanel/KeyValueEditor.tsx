import { Plus, X } from 'lucide-react';
import type { KeyValuePair } from '../../types/workflow';

interface KeyValueEditorProps {
  label: string;
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export default function KeyValueEditor({
  label,
  pairs,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}: KeyValueEditorProps) {
  const handleAdd = () => {
    onChange([...pairs, { key: '', value: '' }]);
  };

  const handleRemove = (index: number) => {
    onChange(pairs.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = pairs.map((pair, i) =>
      i === index ? { ...pair, [field]: value } : pair
    );
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-400">{label}</label>
      
      {pairs.length > 0 && (
        <div className="space-y-2">
          {pairs.map((pair, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={pair.key}
                onChange={(e) => handleChange(index, 'key', e.target.value)}
                placeholder={keyPlaceholder}
                className="flex-1 bg-canvas-bg border border-panel-border rounded-lg px-2 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
              <input
                type="text"
                value={pair.value}
                onChange={(e) => handleChange(index, 'value', e.target.value)}
                placeholder={valuePlaceholder}
                className="flex-1 bg-canvas-bg border border-panel-border rounded-lg px-2 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
              <button
                onClick={() => handleRemove(index)}
                className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                title="Remove"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <button
        onClick={handleAdd}
        className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors"
      >
        <Plus size={14} />
        Add {label.replace(/s$/, '')}
      </button>
    </div>
  );
}
