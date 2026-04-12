import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { ReactNode, useState } from 'react';

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
    <Box
      component="section"
      sx={{
        borderRadius: 2,
        boxShadow: 1,
        bgcolor: disabled ? '#e0e0e0' : '#c2e59c',
        mb: 3,
        opacity: 1,
      }}
    >
      <Button
        onClick={toggle}
        aria-expanded={open}
        disabled={disabled}
        sx={{
          width: '100%',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: 2,
          px: 2,
          py: 1.5,
          textAlign: 'left',
          bgcolor: '#7ec850',
          color: '#222',
          boxShadow: 0,
          '&:hover': { bgcolor: '#a3e072' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <KeyboardArrowDownIcon
            sx={{
              mr: 1.5,
              transition: 'transform 0.2s',
              transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            }}
            aria-hidden="true"
          />
          <Typography
            variant="h6"
            sx={{
              fontSize: 18,
              fontWeight: 600,
              m: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          {meta !== undefined ? meta : open ? 'Hide' : 'Show'}
        </Typography>
      </Button>
      {open ? (
        <Box sx={{ px: 2, py: 2, bgcolor: '#c2e59c', color: '#222', borderRadius: 2 }}>
          {children}
        </Box>
      ) : null}
    </Box>
  );
}
