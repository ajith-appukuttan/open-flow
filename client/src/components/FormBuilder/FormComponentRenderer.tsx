import type { FormComponent } from '../../types/workflow';

interface FormComponentRendererProps {
  component: FormComponent;
  preview?: boolean;
  value?: unknown;
  onChange?: (value: unknown) => void;
}

export default function FormComponentRenderer({ 
  component, 
  preview = false,
  value,
  onChange,
}: FormComponentRendererProps) {
  const baseInputClass = "w-full bg-canvas-bg border border-panel-border rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500";

  const handleChange = (newValue: unknown) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  switch (component.type) {
    case 'text':
    case 'email':
    case 'password':
      return (
        <div>
          {component.label && (
            <label className="block text-sm text-gray-300 mb-1">
              {component.label}
              {component.required && <span className="text-red-400 ml-1">*</span>}
            </label>
          )}
          <input
            type={component.type}
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={component.placeholder}
            required={component.required}
            disabled={!preview}
            className={baseInputClass}
          />
        </div>
      );

    case 'number':
      return (
        <div>
          {component.label && (
            <label className="block text-sm text-gray-300 mb-1">
              {component.label}
              {component.required && <span className="text-red-400 ml-1">*</span>}
            </label>
          )}
          <input
            type="number"
            value={(value as number) ?? ''}
            onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : '')}
            placeholder={component.placeholder}
            min={component.validation?.min}
            max={component.validation?.max}
            required={component.required}
            disabled={!preview}
            className={baseInputClass}
          />
        </div>
      );

    case 'textarea':
      return (
        <div>
          {component.label && (
            <label className="block text-sm text-gray-300 mb-1">
              {component.label}
              {component.required && <span className="text-red-400 ml-1">*</span>}
            </label>
          )}
          <textarea
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={component.placeholder}
            required={component.required}
            disabled={!preview}
            rows={3}
            className={`${baseInputClass} resize-y`}
          />
        </div>
      );

    case 'date':
      return (
        <div>
          {component.label && (
            <label className="block text-sm text-gray-300 mb-1">
              {component.label}
              {component.required && <span className="text-red-400 ml-1">*</span>}
            </label>
          )}
          <input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={component.required}
            disabled={!preview}
            className={baseInputClass}
          />
        </div>
      );

    case 'file':
      return (
        <div>
          {component.label && (
            <label className="block text-sm text-gray-300 mb-1">
              {component.label}
              {component.required && <span className="text-red-400 ml-1">*</span>}
            </label>
          )}
          <div className="relative">
            <input
              type="file"
              onChange={(e) => handleChange(e.target.files?.[0]?.name || '')}
              required={component.required}
              disabled={!preview}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:cursor-pointer hover:file:bg-indigo-500"
            />
          </div>
        </div>
      );

    case 'select':
      return (
        <div>
          {component.label && (
            <label className="block text-sm text-gray-300 mb-1">
              {component.label}
              {component.required && <span className="text-red-400 ml-1">*</span>}
            </label>
          )}
          <select
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={component.required}
            disabled={!preview}
            className={baseInputClass}
          >
            <option value="">Select...</option>
            {component.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );

    case 'multiselect':
      return (
        <div>
          {component.label && (
            <label className="block text-sm text-gray-300 mb-1">
              {component.label}
              {component.required && <span className="text-red-400 ml-1">*</span>}
            </label>
          )}
          <select
            multiple
            value={(value as string[]) || []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              handleChange(selected);
            }}
            required={component.required}
            disabled={!preview}
            className={`${baseInputClass} h-24`}
          >
            {component.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
        </div>
      );

    case 'radio':
      return (
        <div>
          {component.label && (
            <label className="block text-sm text-gray-300 mb-2">
              {component.label}
              {component.required && <span className="text-red-400 ml-1">*</span>}
            </label>
          )}
          <div className="space-y-2">
            {component.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={component.name}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={(e) => handleChange(e.target.value)}
                  disabled={!preview}
                  className="text-indigo-500 bg-canvas-bg border-panel-border focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      );

    case 'checkbox':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={(value as boolean) || false}
            onChange={(e) => handleChange(e.target.checked)}
            disabled={!preview}
            className="rounded bg-canvas-bg border-panel-border text-indigo-500 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-300">
            {component.label}
            {component.required && <span className="text-red-400 ml-1">*</span>}
          </span>
        </label>
      );

    case 'toggle':
      return (
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-gray-300">
            {component.label}
            {component.required && <span className="text-red-400 ml-1">*</span>}
          </span>
          <div className="relative">
            <input
              type="checkbox"
              checked={(value as boolean) || false}
              onChange={(e) => handleChange(e.target.checked)}
              disabled={!preview}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-indigo-600 peer-disabled:opacity-50 transition-colors"></div>
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
          </div>
        </label>
      );

    case 'slider':
      const sliderValue = (value as number) ?? component.validation?.min ?? 0;
      const min = component.validation?.min ?? 0;
      const max = component.validation?.max ?? 100;
      return (
        <div>
          {component.label && (
            <label className="block text-sm text-gray-300 mb-2">
              {component.label}: <span className="text-indigo-400">{sliderValue}</span>
              {component.required && <span className="text-red-400 ml-1">*</span>}
            </label>
          )}
          <input
            type="range"
            value={sliderValue}
            onChange={(e) => handleChange(Number(e.target.value))}
            min={min}
            max={max}
            disabled={!preview}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>
      );

    case 'label':
      return (
        <div className="py-1">
          <h3 className="text-lg font-semibold text-white">{component.label}</h3>
        </div>
      );

    case 'divider':
      return <hr className="border-panel-border my-2" />;

    case 'image':
      return (
        <div className="py-2">
          {component.src ? (
            <img
              src={component.src}
              alt={component.alt || ''}
              className="max-w-full h-auto rounded-lg"
            />
          ) : (
            <div className="h-24 bg-canvas-bg border border-dashed border-panel-border rounded-lg flex items-center justify-center text-gray-500 text-sm">
              No image URL
            </div>
          )}
        </div>
      );

    case 'card':
      return (
        <div className="p-4 bg-white/5 rounded-lg border border-panel-border">
          {component.label && (
            <h4 className="text-sm font-semibold text-white mb-2">{component.label}</h4>
          )}
          <div className="text-xs text-gray-500">Card content area</div>
        </div>
      );

    case 'submit':
      return (
        <button
          type={preview ? 'submit' : 'button'}
          disabled={!preview}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium rounded-lg transition-colors"
        >
          {component.label || 'Submit'}
        </button>
      );

    case 'cancel':
      return (
        <button
          type="button"
          disabled={!preview}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-600/50 text-white font-medium rounded-lg transition-colors"
        >
          {component.label || 'Cancel'}
        </button>
      );

    default:
      return (
        <div className="p-2 bg-red-500/20 text-red-400 rounded text-sm">
          Unknown component: {component.type}
        </div>
      );
  }
}
