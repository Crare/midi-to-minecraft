import ImageModalCarousel from '@components/common/ImageModalCarousel';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useState } from 'react';

const exampleMinecraft1 = `${import.meta.env.BASE_URL}assets/examples/example_minecraft1.png`;
const exampleMinecraft2 = `${import.meta.env.BASE_URL}assets/examples/example_minecraft2.png`;
const exampleSchematic = `${import.meta.env.BASE_URL}assets/examples/example_schematic.png`;

const images = [
  {
    src: exampleSchematic,
    alt: 'Example schematic view',
    caption: 'Schematic view (top-down)',
  },
  {
    src: exampleMinecraft1,
    alt: 'Example Minecraft wiring 1',
    caption: 'In-game wiring example 1',
  },
  {
    src: exampleMinecraft2,
    alt: 'Example Minecraft wiring 2',
    caption: 'In-game wiring example 2',
  },
];

export default function HowToWireTutorial() {
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  const openModal = (idx: number) => {
    setModalIndex(idx);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const prevImage = () => setModalIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const nextImage = () => setModalIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <Box sx={{ my: 2 }}>
      <Button
        variant="contained"
        size="small"
        onClick={() => setTutorialOpen(!tutorialOpen)}
        aria-expanded={tutorialOpen}
        sx={{
          mb: 1,
          textTransform: 'none',
          fontWeight: 500,
          bgcolor: '#3d5f22',
          color: '#fff',
          '&:hover': { bgcolor: '#49732a' },
        }}
      >
        <span style={{ marginRight: 8 }}>How to wire it in Minecraft</span>
        <span>{tutorialOpen ? '▲' : '▼'}</span>
      </Button>
      {tutorialOpen && (
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Box sx={{ mb: 2, color: 'text.secondary', fontSize: '0.95rem' }}>
            <strong>Note:</strong> The schematic is not an exact representation of how the redstone
            needs to be wired. It shows only the timeline and repeater delays. Wiring multiple note
            blocks to play at the same time requires more redstone, as shown in the example pictures
            below.
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {images.map((img, idx) => (
              <figure key={img.src} style={{ margin: 0 }}>
                <img
                  src={img.src}
                  alt={img.alt}
                  style={{ maxWidth: 180, borderRadius: 4, cursor: 'pointer' }}
                  draggable={false}
                  onClick={() => openModal(idx)}
                />
                <figcaption style={{ fontSize: '0.85em', textAlign: 'center' }}>
                  {img.caption}
                </figcaption>
              </figure>
            ))}
          </Box>
        </Box>
      )}
      <ImageModalCarousel
        open={modalOpen}
        images={images}
        index={modalIndex}
        onClose={closeModal}
        onIndexChange={setModalIndex}
      />
    </Box>
  );
}
