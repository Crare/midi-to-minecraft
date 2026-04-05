import { useState } from 'react';

export default function CollapsiblePanel({
  title,
  meta,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  disabled = false,
  className,
  children,
}) {
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
      <button
        type="button"
        className="panel-header panel-header-toggle"
        onClick={toggle}
        aria-expanded={open}
        disabled={disabled}
      >
        <h2>{title}</h2>
        <span className="panel-header-meta">
          {meta !== undefined ? meta : (open ? 'Hide' : 'Show')}
        </span>
      </button>
      {open ? <div className="panel-body">{children}</div> : null}
    </section>
  );
}
