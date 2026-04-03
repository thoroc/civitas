'use client';
import type { ParliamentIndexEntry } from '../schemas';

interface SnapshotHeaderProps {
  index: ParliamentIndexEntry[];
  selectedDate?: string;
  onDateChange: (date: string) => void;
}

const SnapshotHeader = ({
  index,
  selectedDate,
  onDateChange,
}: SnapshotHeaderProps) => (
  <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
    <div>
      <h1>Chamber Composition</h1>
      <p className='text-sm text-muted max-w-2xl'>
        Historical snapshots of the chamber. Select a term start date to view
        its composition; filters apply per snapshot.
      </p>
    </div>
    <div className='flex gap-2 items-end'>
      <label className='form-control w-56'>
        <div className='label py-1'>
          <span className='label-text text-xs uppercase tracking-wide'>
            Snapshot Date
          </span>
        </div>
        <select
          className='select select-sm select-bordered'
          value={selectedDate}
          onChange={e => onDateChange(e.target.value)}
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
