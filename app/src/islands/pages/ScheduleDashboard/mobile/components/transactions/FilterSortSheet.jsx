import { useState } from 'react';
import BottomSheet from '../BottomSheet.jsx';

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function FilterSortSheet({ isOpen, onClose, filters, onApply }) {
  const [status, setStatus] = useState(filters?.status || 'all');
  const [sortBy, setSortBy] = useState(filters?.sortBy || 'date');

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Filter & Sort">
      <div className="filter-sheet">
        <div className="filter-sheet__section">
          <label>Status</label>
          <div className="filter-chips">
            {['all', 'pending', 'accepted', 'declined'].map((state) => (
              <button
                key={state}
                className={status === state ? 'active' : ''}
                onClick={() => setStatus(state)}
                type="button"
              >
                {capitalize(state)}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-sheet__section">
          <label>Sort By</label>
          <div className="filter-chips">
            <button
              className={sortBy === 'date' ? 'active' : ''}
              onClick={() => setSortBy('date')}
              type="button"
            >
              Date
            </button>
            <button
              className={sortBy === 'amount' ? 'active' : ''}
              onClick={() => setSortBy('amount')}
              type="button"
            >
              Amount
            </button>
          </div>
        </div>
        <button
          className="filter-sheet__apply"
          onClick={() => onApply({ status, sortBy })}
          type="button"
        >
          Apply Filters
        </button>
      </div>
    </BottomSheet>
  );
}
