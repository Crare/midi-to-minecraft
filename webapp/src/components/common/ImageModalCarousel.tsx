import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';

export interface ImageModalCarouselImage {
  src: string;
  alt: string;
  caption?: string;
}

interface ImageModalCarouselProps {
  open: boolean;
  images: ImageModalCarouselImage[];
  index: number;
  onClose: () => void;
  onIndexChange: (idx: number) => void;
}

export default function ImageModalCarousel({
  open,
  images,
  index,
  onClose,
  onIndexChange,
}: ImageModalCarouselProps) {
  const prevImage = () => onIndexChange(index === 0 ? images.length - 1 : index - 1);
  const nextImage = () => onIndexChange(index === images.length - 1 ? 0 : index + 1);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          m: 0,
          width: '90vw',
          height: '90vh',
          maxWidth: '90vw',
          maxHeight: '90vh',
          borderRadius: 4,
          bgcolor: '#222',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 0,
          bgcolor: '#222',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: '#fff',
            zIndex: 10,
            background: 'rgba(0,0,0,0.3)',
          }}
          aria-label="Close"
        >
          <CloseIcon />
        </IconButton>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: 'calc(90vh - 120px)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0,
          }}
        >
          {/* Background image layer */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              background: '#111',
            }}
          >
            <img
              src={images[index].src}
              alt={images[index].alt}
              style={{
                maxHeight: '70vh',
                maxWidth: '80vw',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: 12,
                boxShadow: '0 4px 32px #000a',
                display: 'block',
                margin: '0 auto',
              }}
              draggable={false}
            />
          </Box>
          {/* Foreground navigation buttons, 50/50 clickable */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'row',
              pointerEvents: 'none',
            }}
          >
            <Box
              onClick={prevImage}
              aria-label="Previous image"
              sx={{
                width: '50%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                pointerEvents: 'auto',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
                '&:hover': { background: 'rgba(0,0,0,0.08)' },
                zIndex: 3,
                userSelect: 'none',
              }}
            >
              <Box
                sx={{
                  color: '#fff',
                  background: 'rgba(0,0,0,0.3)',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ml: 2,
                }}
              >
                <ArrowBackIosNewIcon />
              </Box>
            </Box>
            <Box
              onClick={nextImage}
              aria-label="Next image"
              sx={{
                width: '50%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                pointerEvents: 'auto',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
                '&:hover': { background: 'rgba(0,0,0,0.08)' },
                zIndex: 3,
                userSelect: 'none',
              }}
            >
              <Box
                sx={{
                  color: '#fff',
                  background: 'rgba(0,0,0,0.3)',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                }}
              >
                <ArrowForwardIosIcon />
              </Box>
            </Box>
          </Box>
        </Box>
        <Box sx={{ color: '#fff', fontSize: 20, mb: 2, textAlign: 'center', width: '100%' }}>
          {images[index].caption}
        </Box>
      </Box>
    </Dialog>
  );
}
