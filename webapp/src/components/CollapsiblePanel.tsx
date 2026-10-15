import { useId, useState, type ReactNode } from 'react';

interface CollapsiblePanelProps {
  title: ReactNode;
  meta?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  disabled?: boolean;
  collapsible?: boolean;
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
  collapsible = true,
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

  if (!collapsible) {
    return (
      <section className={`panel${className ? ` ${className}` : ''}`}>
        <h2 className="panel-heading">
          <span className="panel-header panel-header-toggle panel-header-static">
            <span className="panel-title">{title}</span>
            {meta !== undefined ? <span className="panel-header-meta">{meta}</span> : null}
          </span>
        </h2>
        <div className="panel-body">{children}</div>
      </section>
    );
  }

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
