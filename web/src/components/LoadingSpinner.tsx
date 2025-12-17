import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  className = '',
}) => {
  return (
    <div className={`loading-spinner ${size} ${className}`}>
      <div className="spinner-circle"></div>
      {message && <div className="spinner-message">{message}</div>}
    </div>
  );
};