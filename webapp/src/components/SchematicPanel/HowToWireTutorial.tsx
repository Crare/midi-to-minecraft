interface HowToWireTutorialProps {
  tutorialOpen: boolean;
  setTutorialOpen: (open: boolean) => void;
}

export default function HowToWireTutorial({
  tutorialOpen,
  setTutorialOpen,
}: HowToWireTutorialProps) {
  return (
    <div className="schematic-tutorial">
      <button
        type="button"
        className="schematic-tutorial-toggle"
        onClick={() => setTutorialOpen((o) => !o)}
        aria-expanded={tutorialOpen}
      >
        <span className="schematic-tutorial-toggle-label">How to wire it in Minecraft</span>
        <span className="schematic-tutorial-toggle-arrow">{tutorialOpen ? '▲' : '▼'}</span>
      </button>
      {tutorialOpen && (
        <div className="schematic-tutorial-body">
          <p className="schematic-tutorial-note">
            <strong>Note:</strong> The schematic is not an exact representation of how the redstone
            needs to be wired. It shows only the timeline and repeater delays. Wiring multiple note
            blocks to play at the same time requires more redstone, as shown in the example pictures
            below.
          </p>
          <div className="schematic-tutorial-images">
            <figure className="schematic-tutorial-figure">
              <img
                src={`${import.meta.env.BASE_URL}assets/example_schematic.png`}
                alt="Example schematic view"
              />
              <figcaption>Schematic view (top-down)</figcaption>
            </figure>
            <figure className="schematic-tutorial-figure">
              <img
                src={`${import.meta.env.BASE_URL}assets/example_minecraft1.png`}
                alt="Example Minecraft wiring 1"
              />
              <figcaption>In-game wiring example 1</figcaption>
            </figure>
            <figure className="schematic-tutorial-figure">
              <img
                src={`${import.meta.env.BASE_URL}assets/example_minecraft2.png`}
                alt="Example Minecraft wiring 2"
              />
              <figcaption>In-game wiring example 2</figcaption>
            </figure>
          </div>
        </div>
      )}
    </div>
  );
}
