import type { SelectedEventType } from '../hooks/use-snapshot-selection';
import type { ParliamentIndexEntry } from '../schemas';
import EventTypeSelector from './event-type-selector';

interface SnapshotHeaderProps {
  index: ParliamentIndexEntry[];
  isEmpty: boolean;
  selectedDate?: string;
  onDateChange: (date: string) => void;
  selectedEventType: SelectedEventType;
  onEventTypeChange: (value: SelectedEventType) => void;
  showAllOption: boolean;
}

const SnapshotHeader = ({
  index,
  isEmpty,
  selectedDate,
  onDateChange,
  selectedEventType,
  onEventTypeChange,
  showAllOption,
}: SnapshotHeaderProps) => (
  <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
    <div>
      <h1>Chamber Composition</h1>
      <p className='text-sm text-muted max-w-2xl'>
        Historical snapshots tied to general elections and by-elections. Select
        an event type and date to view composition; filters apply per snapshot.
      </p>
    </div>
    <div className='flex gap-3 items-end flex-wrap justify-end'>
      <EventTypeSelector
        selectedEventType={selectedEventType}
        onEventTypeChange={onEventTypeChange}
        showAllOption={showAllOption}
      />
      <label className='form-control w-56'>
        <div className='label py-1'>
          <span className='label-text text-xs uppercase tracking-wide'>
            Event Date
          </span>
        </div>
        <select
          className='select select-sm select-bordered'
          value={selectedDate}
          onChange={e => onDateChange(e.target.value)}
          disabled={isEmpty}
        >
          {index
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .map(entry => (
              <option key={entry.date} value={entry.date}>
                {entry.date.slice(0, 10)}
              </option>
            ))}
        </select>
      </label>
    </div>
  </div>
);

export default SnapshotHeader;
