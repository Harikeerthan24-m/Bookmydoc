import React from 'react';
import PropTypes from 'prop-types';
import { ScaleLoader } from 'react-spinners';
import './Loading.css';

/**
 * Loading component that can be used throughout the application
 * @param {Object} props - Component props
 * @param {string} [props.size='default'] - Size of the loading component ('small', 'default', 'large')
 * @param {string} [props.type='default'] - Type of loading display ('default', 'fullscreen', 'inline', 'overlay')
 * @param {string} [props.text] - Text to display below the loading spinner
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Additional inline styles
 * @returns {React.ReactElement} Loading component
 */
const Loading = ({
  size = 'default',
  type = 'default',
  text,
  className = '',
  style = {},
  ...props
}) => {
  // Define sizes for the loader
  const sizeMap = {
    small: { height: 15, width: 3, margin: 2 },
    default: { height: 25, width: 4, margin: 2 },
    large: { height: 35, width: 6, margin: 3 },
  };

  // Get loader dimensions based on size prop
  const loaderSize = sizeMap[size] || sizeMap.default;

  // Determine container classes based on type
  const containerClasses = [
    'loading-container',
    type === 'fullscreen' && 'fullscreen',
    type === 'inline' && 'inline',
    size === 'small' && 'small',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const loadingContent = (
    <div className="loading-content">
      <ScaleLoader color="#18A0FB" {...loaderSize} {...props} />
      {text && <p className="loading-text">{text}</p>}
    </div>
  );

  // For overlay type, wrap in a div with overlay styles
  if (type === 'overlay') {
    return <div className="loading-overlay">{loadingContent}</div>;
  }

  return (
    <div className={containerClasses} style={style}>
      {loadingContent}
    </div>
  );
};

Loading.propTypes = {
  size: PropTypes.oneOf(['small', 'default', 'large']),
  type: PropTypes.oneOf(['default', 'fullscreen', 'inline', 'overlay']),
  text: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default Loading;
