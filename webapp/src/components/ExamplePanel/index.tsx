import { useEffect, useRef, useState } from 'react';
import CollapsiblePanel from '../CollapsiblePanel';

interface ExampleImage {
  file: string;
  alt: string;
  caption: string;
}

const images: ExampleImage[] = [
  { file: 'example_track_visualization.png', alt: 'Track visualization', caption: 'Track visualization with playback' },
  { file: 'example_schematic.png', alt: 'Top-down build schematic', caption: 'Top-down build schematic' },
  { file: 'example_minecraft1.png', alt: 'In-game build example', caption: 'In Minecraft — example build 1' },
  { file: 'example_minecraft2.png', alt: 'In-game build example 2', caption: 'In Minecraft — example build 2' },
];

const src = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;

export default function ExamplePanel() {
  const [active, setActive] = useState<ExampleImage | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const open = (image: ExampleImage) => {
    openerRef.current = document.activeElement as HTMLElement | null;
    setActive(image);
  };
  const close = () => {
    setActive(null);
    openerRef.current?.focus();
  };

  useEffect(() => {
    if (!active) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      // The close button is the only focusable control, so keep focus on it.
      if (event.key === 'Tab') {
        event.preventDefault();
        closeRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active]);

  return (
    <CollapsiblePanel title="Example Output" defaultOpen={true}>
      <div className="example-panel__layout">
        <p className="example-panel__description">
          Upload any MIDI file and convert it into a Minecraft note block sequence.
          Get a JSON file for each instrument track, a top-down build schematic with
          repeater delays, resource counts and build dimensions — plus an interactive
          visualization you can play back right in the browser.
        </p>
        <div className="example-panel__images">
          {images.map((image) => (
            <figure className="example-panel__figure" key={image.file}>
              <button
                type="button"
                className="example-panel__zoom"
                onClick={() => open(image)}
                aria-label={`View ${image.caption} fullscreen`}
                aria-haspopup="dialog"
              >
                <img src={src(image.file)} alt={image.alt} />
              </button>
              <figcaption>{image.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
      {active ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={active.caption}
          onClick={close}
        >
          <img src={src(active.file)} alt={active.alt} />
          <p>{active.caption}</p>
          <button
            ref={closeRef}
            type="button"
            className="lightbox__close"
            aria-label="Close fullscreen image"
            onClick={(event) => { event.stopPropagation(); close(); }}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      ) : null}
    </CollapsiblePanel>
  );
}
