import React from 'react';

const Progress = ({ value = 0 }) => {
  return (
    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
      <div style={{ width: `${value}%` }} className="h-2 bg-blue-600 transition-all" />
    </div>
  );
};

export default Progress;

