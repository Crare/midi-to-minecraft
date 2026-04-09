import CollapsiblePanel from '../common/CollapsiblePanel';

export default function ExamplePanel() {
  return (
    <CollapsiblePanel title="Example Output" defaultOpen={true}>
      <div className="example-panel__layout">
        <p className="example-panel__description">
          Upload any MIDI file and convert it into a Minecraft note block sequence. Get a JSON file
          for each instrument track, a top-down build schematic with repeater delays, resource
          counts and build dimensions — plus an interactive visualization you can play back right in
          the browser.
        </p>
        <div className="example-panel__images">
          <figure className="example-panel__figure">
            <img
              src={`${import.meta.env.BASE_URL}assets/examples/example_track_visualization.png`}
              alt="Track visualization"
            />
            <figcaption>Track visualization with playback</figcaption>
          </figure>
          <figure className="example-panel__figure">
            <img
              src={`${import.meta.env.BASE_URL}assets/examples/example_schematic.png`}
              alt="Top-down build schematic"
            />
            <figcaption>Top-down build schematic</figcaption>
          </figure>
          <figure className="example-panel__figure">
            <img
              src={`${import.meta.env.BASE_URL}assets/examples/example_minecraft1.png`}
              alt="In-game build example"
            />
            <figcaption>In Minecraft — example build 1</figcaption>
          </figure>
          <figure className="example-panel__figure">
            <img
              src={`${import.meta.env.BASE_URL}assets/examples/example_minecraft2.png`}
              alt="In-game build example 2"
            />
            <figcaption>In Minecraft — example build 2</figcaption>
          </figure>
        </div>
      </div>
    </CollapsiblePanel>
  );
}
