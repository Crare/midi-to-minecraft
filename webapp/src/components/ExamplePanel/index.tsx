import CollapsiblePanel from '@components/common/CollapsiblePanel';
import ImageModalCarousel, { ImageModalCarouselImage } from '@components/common/ImageModalCarousel';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

interface ExamplePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExamplePanel({ open, onOpenChange }: ExamplePanelProps) {
  const images: ImageModalCarouselImage[] = [
    {
      src: `${import.meta.env.BASE_URL}assets/examples/example_track_visualization.png`,
      alt: 'Track visualization',
      caption: 'Track visualization with playback',
    },
    {
      src: `${import.meta.env.BASE_URL}assets/examples/example_schematic.png`,
      alt: 'Top-down build schematic',
      caption: 'Top-down build schematic',
    },
    {
      src: `${import.meta.env.BASE_URL}assets/examples/example_minecraft1.png`,
      alt: 'In-game build example',
      caption: 'In Minecraft — example build 1',
    },
    {
      src: `${import.meta.env.BASE_URL}assets/examples/example_minecraft2.png`,
      alt: 'In-game build example 2',
      caption: 'In Minecraft — example build 2',
    },
  ];

  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  return (
    <CollapsiblePanel
      title="Example Output"
      open={open}
      onOpenChange={onOpenChange}
      defaultOpen={true}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Upload any MIDI file and convert it into a Minecraft note block sequence. Get a JSON file
          for each instrument track, a top-down build schematic with repeater delays, resource
          counts and build dimensions — plus an interactive visualization you can play back right in
          the browser.
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
          {images.map((img, idx) => (
            <Box
              key={img.src}
              component="figure"
              sx={{
                m: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: 220,
                cursor: 'pointer',
              }}
              onClick={() => {
                setModalIndex(idx);
                setModalOpen(true);
              }}
            >
              <Box
                component="img"
                src={img.src}
                alt={img.alt}
                draggable={false}
                sx={{ width: '100%', borderRadius: 2, boxShadow: 1, mb: 1 }}
              />
              <figcaption style={{ textAlign: 'center', fontSize: 14 }}>{img.caption}</figcaption>
            </Box>
          ))}
        </Box>
        <ImageModalCarousel
          open={modalOpen}
          images={images}
          index={modalIndex}
          onClose={() => setModalOpen(false)}
          onIndexChange={setModalIndex}
        />
      </Box>
    </CollapsiblePanel>
  );
}
