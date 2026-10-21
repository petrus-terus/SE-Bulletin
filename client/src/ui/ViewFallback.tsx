import React from 'react';

export const ViewFallback: React.FC<{ size?: number; minHeight?: string }> = ({
  size = 32,
  minHeight = '200px',
}) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight }}>
    <div
      className="spinner-ring"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    />
  </div>
);
