'use client';

import axios from 'axios';
import { useEffect, useState } from 'react';

const Cat = () => {
  const [fact, setFact] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFact = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('https://catfact.ninja/fact');
      setFact(response.data.fact);
    } catch {
      setError('Failed to load a fact');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFact();
  }, []);

  return (
    <div className='space-y-6 max-w-lg'>
      <header>
        <h1>Cat Facts</h1>
        <p className='text-sm text-muted'>
          Lighthearted demo page using a public API.
        </p>
      </header>
      <div className='card-surface space-y-4'>
        <div>
          <p className='text-sm font-medium mb-1'>Random Fact</p>
          {error && <p className='text-sm text-error'>{error}</p>}
          {!error && (
            <p className='text-neutral leading-relaxed min-h-[3rem]'>
              {loading ? 'Loading…' : fact}
            </p>
          )}
        </div>
        <div className='flex gap-2'>
          <button
            className='btn btn-sm btn-primary'
            disabled={loading}
            onClick={fetchFact}
          >
            {loading ? 'Fetching…' : 'Get New Fact'}
          </button>
          <button className='btn btn-sm' onClick={() => setFact('')}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cat;
