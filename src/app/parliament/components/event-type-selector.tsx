'use client';
import type { SelectedEventType } from '../hooks/use-snapshot-selection';

interface EventTypeSelectorProps {
  selectedEventType: SelectedEventType;
  onEventTypeChange: (value: SelectedEventType) => void;
  showAllOption: boolean;
}

const EventTypeSelector = ({
  selectedEventType,
  onEventTypeChange,
  showAllOption,
}: EventTypeSelectorProps) => (
  <div className='join'>
    <button
      type='button'
      className={`btn btn-sm join-item ${
        selectedEventType === 'general' ? 'btn-primary' : 'btn-ghost'
      }`}
      onClick={() => onEventTypeChange('general')}
    >
      General elections
    </button>
    <button
      type='button'
      className={`btn btn-sm join-item ${
        selectedEventType === 'by-election' ? 'btn-primary' : 'btn-ghost'
      }`}
      onClick={() => onEventTypeChange('by-election')}
    >
      By-elections
    </button>
    {showAllOption && (
      <button
        type='button'
        className={`btn btn-sm join-item ${
          selectedEventType === 'all' ? 'btn-primary' : 'btn-ghost'
        }`}
        onClick={() => onEventTypeChange('all')}
      >
        All
      </button>
    )}
  </div>
);

export default EventTypeSelector;
