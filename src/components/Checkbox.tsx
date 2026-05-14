import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md';
}

/** HLTY-styled checkbox: mint-tegel met wit Check-icoon wanneer aangevinkt,
 *  witte tegel met grijze rand wanneer niet. Vervang de native browser-look
 *  zodat de filter sidebar én forms op de site dezelfde checkbox-look hebben. */
export default function Checkbox({ checked, onChange, size = 'md' }: CheckboxProps) {
  const dims = size === 'sm' ? 'w-4 h-4' : 'w-[18px] h-[18px]';
  const iconDims = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  return (
    <span className="inline-flex items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={`${dims} rounded-md flex items-center justify-center shrink-0 transition-all ${
          checked
            ? 'bg-[var(--color-primary)] border border-[var(--color-primary)]'
            : 'bg-white border border-[var(--color-border)]'
        }`}
      >
        {checked && <Check className={`${iconDims} text-white`} strokeWidth={3} />}
      </span>
    </span>
  );
}
