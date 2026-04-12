import Box from '@mui/material/Box';
import React from 'react';

export interface SupportBlockProps {
  blockId: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

// Returns the correct SVG path for a given blockId
export function getSupportBlockSvg(blockId: string) {
  const blockName = (blockId || 'minecraft:dirt').replace('minecraft:', '');
  return `assets/icons/support-block-${blockName}.svg`;
}

export const SupportBlock: React.FC<Omit<SupportBlockProps, 'className'>> = ({
  blockId,
  size = 18,
  style = {},
  alt = '',
}) => (
  <Box
    component="img"
    src={getSupportBlockSvg(blockId)}
    alt={alt || blockId}
    draggable={false}
    aria-hidden={alt ? undefined : true}
    sx={{
      width: size,
      height: size,
      display: 'inline-block',
      verticalAlign: 'middle',
      flexShrink: 0,
      ...style,
    }}
  />
);
