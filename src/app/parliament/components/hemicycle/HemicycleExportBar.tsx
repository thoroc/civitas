import React from 'react';

interface HemicycleExportBarProps {
  compact: boolean;
  onToggleCompact: () => void;
  onDownloadSVG: () => void;
  onDownloadPNG: () => void;
}

const HemicycleExportBar: React.FC<HemicycleExportBarProps> = ({
  compact,
  onToggleCompact,
  onDownloadSVG,
  onDownloadPNG,
}) => {
  return (
    <div className='absolute top-2 right-2 flex gap-2 z-20'>
      <button
        type='button'
        className='btn btn-xs'
        onClick={onToggleCompact}
        aria-label={
          compact ? 'Switch to full tooltip' : 'Switch to compact tooltip'
        }
      >
        {compact ? 'Full' : 'Compact'}
      </button>
      <button
        type='button'
        className='btn btn-xs'
        onClick={onDownloadSVG}
        aria-label='Download SVG hemicycle'
      >
        SVG
      </button>
      <button
        type='button'
        className='btn btn-xs'
        onClick={onDownloadPNG}
        aria-label='Download PNG hemicycle'
      >
        PNG
      </button>
    </div>
  );
};

export default HemicycleExportBar;
