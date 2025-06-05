/**
 * ================================================================
 * TallySyncPro - Loading Animation Component
 * ================================================================
 * 
 * Beautiful loading animations for various application states
 * 
 * @author Digidenone Team
 * @version 1.0
 * @since 2025
 * 
 * ================================================================
 */

import React from 'react';

interface LoadingAnimationProps {
  type?: 'spinner' | 'pulse' | 'wave' | 'sync' | 'upload';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  message?: string;
  progress?: number;
  className?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  type = 'spinner',
  size = 'md',
  color = 'primary',
  message,
  progress,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
  };

  const renderSpinner = () => (
    <div className={`inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${sizeClasses[size]} ${colorClasses[color]}`}>
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  );

  const renderPulse = () => (
    <div className={`flex space-x-1 ${className}`}>
      <div className={`${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full animate-pulse`}></div>
      <div className={`${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full animate-pulse`} style={{ animationDelay: '0.1s' }}></div>
      <div className={`${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full animate-pulse`} style={{ animationDelay: '0.2s' }}></div>
    </div>
  );

  const renderWave = () => (
    <div className={`flex items-end space-x-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-2 bg-current ${colorClasses[color]} rounded-full animate-wave`}
          style={{
            height: size === 'sm' ? '16px' : size === 'md' ? '24px' : '32px',
            animationDelay: `${i * 0.1}s`
          }}
        ></div>
      ))}
    </div>
  );

  const renderSync = () => (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className={`absolute inset-0 border-4 border-current ${colorClasses[color]} rounded-full animate-ping opacity-75`}></div>
      <div className={`relative border-4 border-current ${colorClasses[color]} rounded-full ${sizeClasses[size]} animate-pulse`}>
        <div className="absolute inset-2 bg-current rounded-full"></div>
      </div>
    </div>
  );

  const renderUpload = () => (
    <div className={`relative ${className}`}>
      <div className={`${sizeClasses[size]} ${colorClasses[color]}`}>
        <svg className="animate-bounce" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          <path className="animate-pulse" d="M12,11L16,15H13V19H11V15H8L12,11Z" />
        </svg>
      </div>
    </div>
  );

  const renderProgressBar = () => (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{message || 'Loading...'}</span>
        {progress !== undefined && (
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ease-out ${
            color === 'primary' ? 'bg-blue-600' :
            color === 'success' ? 'bg-green-600' :
            color === 'warning' ? 'bg-yellow-600' :
            color === 'danger' ? 'bg-red-600' :
            'bg-gray-600'
          }`}
          style={{ width: `${progress || 0}%` }}
        ></div>
      </div>
    </div>
  );

  const renderAnimation = () => {
    switch (type) {
      case 'pulse':
        return renderPulse();
      case 'wave':
        return renderWave();
      case 'sync':
        return renderSync();
      case 'upload':
        return renderUpload();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {progress !== undefined ? renderProgressBar() : (
        <>
          {renderAnimation()}
          {message && (
            <p className={`mt-3 text-sm ${colorClasses[color]} animate-pulse`}>
              {message}
            </p>
          )}
        </>
      )}
    </div>
  );
};

// Custom CSS for wave animation (add to your global CSS)
const loadingStyles = `
  @keyframes wave {
    0%, 40%, 100% {
      transform: scaleY(0.4);
    }
    20% {
      transform: scaleY(1);
    }
  }
  
  .animate-wave {
    animation: wave 1.2s infinite ease-in-out;
  }
`;

// Preset loading components for common use cases
export const SyncingLoader = ({ message = "Synchronizing with Tally..." }) => (
  <LoadingAnimation type="sync" size="lg" color="primary" message={message} />
);

export const UploadingLoader = ({ message = "Uploading file...", progress }: { message?: string; progress?: number }) => (
  <LoadingAnimation type="upload" size="md" color="success" message={message} progress={progress} />
);

export const ProcessingLoader = ({ message = "Processing data..." }) => (
  <LoadingAnimation type="wave" size="md" color="warning" message={message} />
);

export const ConnectingLoader = ({ message = "Connecting to database..." }) => (
  <LoadingAnimation type="pulse" size="md" color="primary" message={message} />
);

// Full screen overlay loader
export const OverlayLoader: React.FC<{
  isVisible: boolean;
  message?: string;
  progress?: number;
}> = ({ isVisible, message, progress }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <LoadingAnimation 
            type="sync" 
            size="lg" 
            color="primary" 
            message={message}
            progress={progress}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
