import { useState } from 'react';

const exampleMinecraft1 = `${import.meta.env.BASE_URL}assets/examples/example_minecraft1.png`;
const exampleMinecraft2 = `${import.meta.env.BASE_URL}assets/examples/example_minecraft2.png`;
const exampleSchematic = `${import.meta.env.BASE_URL}assets/examples/example_schematic.png`;

export default function HowToWireTutorial() {
  const [tutorialOpen, setTutorialOpen] = useState(false);

  return (
    <div className="schematic-tutorial">
      <button
        type="button"
        className="schematic-tutorial-toggle"
        onClick={() => setTutorialOpen(!tutorialOpen)}
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
              <img src={exampleSchematic} alt="Example schematic view" />
              <figcaption>Schematic view (top-down)</figcaption>
            </figure>
            <figure className="schematic-tutorial-figure">
              <img src={exampleMinecraft1} alt="Example Minecraft wiring 1" />
              <figcaption>In-game wiring example 1</figcaption>
            </figure>
            <figure className="schematic-tutorial-figure">
              <img src={exampleMinecraft2} alt="Example Minecraft wiring 2" />
              <figcaption>In-game wiring example 2</figcaption>
            </figure>
          </div>
        </div>
      )}
    </div>
  );
}
