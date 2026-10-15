import { useId, useState, type ReactNode } from 'react';

interface CollapsiblePanelProps {
  title: ReactNode;
  meta?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

export default function CollapsiblePanel({
  title,
  meta,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  disabled = false,
  className,
  children,
}: CollapsiblePanelProps) {
  const bodyId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const toggle = () => {
    if (disabled) return;
    if (isControlled) {
      onOpenChange?.(!open);
    } else {
      setUncontrolledOpen((o) => !o);
    }
  };

  return (
    <section className={`panel${className ? ` ${className}` : ''}`}>
      <h2 className="panel-heading">
        <button
          type="button"
          className="panel-header panel-header-toggle"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={bodyId}
          aria-disabled={disabled || undefined}
        >
          <span className="panel-title">{title}</span>
          <span className="panel-header-meta">
            {meta !== undefined ? meta : (open ? 'Hide' : 'Show')}
          </span>
        </button>
      </h2>
      {open ? <div className="panel-body" id={bodyId}>{children}</div> : null}
    </section>
  );
}
