// components/Button.js
import React from 'react';

const maxtap = ({ onClick, children }) => {
  return (
    <button onClick={onClick}>
      {children}
    </button>
  );
};

export default maxtap;
