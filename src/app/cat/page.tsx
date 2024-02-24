'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const Cat = () => {
  const [fact, setFact] = useState('');

  const fetchFact = async () => {
    axios.get('https://catfact.ninja/fact').then((response) => {
      setFact(response.data.fact);
    });
  };

  useEffect(() => {
    fetchFact();
  }, []);

  const handleClick = () => {
    fetchFact();
  };

  return (
    <div className="Cat">
      <h2>Press the button for a random cat fact!</h2>
      <hr />
      <button></button>
      <button className="btn btn-primary" onClick={() => handleClick()}>
        Get Cat fact
      </button>
      <p>{fact}</p>
    </div>
  );
};

export default Cat;
