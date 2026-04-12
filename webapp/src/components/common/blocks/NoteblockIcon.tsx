import Box from '@mui/material/Box';
import React from 'react';

interface NoteblockIconProps {
  size?: number;
  style?: React.CSSProperties;
  alt?: string;
}

export function NoteblockIcon({ size = 32, style, alt = 'noteblock' }: NoteblockIconProps) {
  const src = `${import.meta.env.BASE_URL}assets/icons/noteblock.svg`;
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      draggable={false}
      sx={{ width: size, height: size, mb: 0, ...style }}
    />
  );
}

export default NoteblockIcon;
