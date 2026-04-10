import React from 'react';

interface NoteblockIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

export function NoteblockIcon({
  size = 32,
  className,
  style,
  alt = 'noteblock',
}: NoteblockIconProps) {
  const src = `${import.meta.env.BASE_URL}assets/icons/noteblock.svg`;
  return (
    <img
      className={className || 'note-img'}
      src={src}
      alt={alt}
      style={{ width: size, height: size, marginBottom: 0, ...style }}
    />
  );
}

export default NoteblockIcon;
