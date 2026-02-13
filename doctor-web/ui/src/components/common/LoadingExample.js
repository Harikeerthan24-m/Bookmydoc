import React from 'react';
import Loading from './Loading';

const LoadingExample = () => {
  return (
    <div>
      {/* Default Loading */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Default Loading</h3>
        <Loading text="Loading..." />
      </div>

      {/* Small Inline Loading */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Small Inline Loading</h3>
        <Loading size="small" type="inline" />
      </div>

      {/* Loading with Custom Text */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Loading with Custom Text</h3>
        <Loading text="Fetching data..." size="large" />
      </div>

      {/* Loading Overlay Example */}
      <div
        style={{
          marginBottom: '2rem',
          position: 'relative',
          height: '200px',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
        }}
      >
        <h3>Loading Overlay Example</h3>
        <p>Content behind the overlay</p>
        <Loading type="overlay" text="Processing..." />
      </div>

      {/* Fullscreen Loading (commented out to not block the page) */}
      {/* <Loading type="fullscreen" text="Loading application..." /> */}
    </div>
  );
};

export default LoadingExample;
