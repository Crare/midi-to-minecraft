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

export const SupportBlock: React.FC<SupportBlockProps> = ({
  blockId,
  size = 18,
  className = '',
  style = {},
  alt = '',
}) => (
  <img
    src={getSupportBlockSvg(blockId)}
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    alt={alt || blockId}
    draggable={false}
    aria-hidden={alt ? undefined : true}
  />
);
