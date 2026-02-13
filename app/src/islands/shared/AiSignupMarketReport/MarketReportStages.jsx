/**
 * Stage/status display components for AI Signup Market Report
 * Contains LottieAnimation, ParsingStage, LoadingStage, FinalMessage,
 * EmailExistsMessage, and NavigationButtons sub-components
 */

import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

const PARSING_LOTTIE_URL = '/assets/images/animation-lottie-loading.json';
// Use a JSON lottie instead of .lottie format (which requires special handling)
const LOADING_LOTTIE_URL = '/assets/images/animation-lottie-loading.json';
const SUCCESS_LOTTIE_URL = '/assets/images/report-lottie.json';

function LottieAnimation({ src, loop = true, autoplay = true, className = '' }) {
  const [animationData, setAnimationData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadAnimationData = async () => {
      try {
        console.log('[LottieAnimation] Loading animation from:', src);
        const response = await fetch(src);

        // Check if this is a .lottie file (dotLottie format) which is a ZIP container
        if (src.endsWith('.lottie')) {
          console.warn('[LottieAnimation] .lottie format detected - this needs special handling');
          // For now, skip .lottie files - they need @lottiefiles/dotlottie-react
          if (isMounted) {
            setError('Unsupported .lottie format');
          }
          return;
        }

        const data = await response.json();
        console.log('[LottieAnimation] Animation loaded successfully');

        if (isMounted) {
          setAnimationData(data);
        }
      } catch (error) {
        console.error('[LottieAnimation] Failed to load Lottie animation:', error);
        console.error('[LottieAnimation] URL:', src);
        if (isMounted) {
          setError(error.message);
        }
      }
    };

    loadAnimationData();

    return () => {
      isMounted = false;
    };
  }, [src]);

  if (error) {
    console.warn('[LottieAnimation] Rendering placeholder due to error:', error);
    return <div className={className} style={{ minHeight: '200px' }} />;
  }

  if (!animationData) {
    return <div className={className} style={{ minHeight: '200px' }} />;
  }

  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      className={className}
    />
  );
}

export function ParsingStage() {
  return (
    <div className="parsing-container">
      <div className="parsing-lottie-wrapper">
        <LottieAnimation
          src={PARSING_LOTTIE_URL}
          loop={true}
          autoplay={true}
          className="parsing-lottie"
        />
        {/* Fallback spinner shown while Lottie loads or if it fails */}
        <div className="loading-spinner-fallback" />
      </div>
      <h3 className="parsing-message">Analyzing your request...</h3>
      <p className="parsing-sub-message">Please wait while we extract the information</p>
    </div>
  );
}

export function LoadingStage({ message }) {
  return (
    <div className="loading-container">
      <div className="loading-lottie-wrapper">
        <LottieAnimation
          src={LOADING_LOTTIE_URL}
          loop={true}
          autoplay={true}
          className="loading-lottie"
        />
        {/* Fallback spinner shown while Lottie loads or if it fails */}
        <div className="loading-spinner-fallback" />
      </div>
      <h3 className="loading-message">{message}</h3>
      <p className="loading-sub-message">This will only take a moment...</p>
    </div>
  );
}

export function FinalMessage({ message, isAsync = false }) {
  return (
    <div className="final-container">
      <div className="final-lottie-wrapper">
        <LottieAnimation
          src={SUCCESS_LOTTIE_URL}
          loop={true}
          autoplay={true}
          className="final-lottie"
        />
      </div>
      <h3 className="final-title">Success!</h3>
      <p className="final-message">{message}</p>
      {isAsync ? (
        <p className="final-sub-message">
          We&apos;re analyzing your preferences in the background. Your personalized market research report will be ready by tomorrow morning!
        </p>
      ) : (
        <p className="final-sub-message">
          Check your inbox for the comprehensive market research report.
        </p>
      )}
    </div>
  );
}

export function EmailExistsMessage({ email, onLoginClick }) {
  return (
    <div className="final-container">
      <div className="final-lottie-wrapper" style={{ opacity: 0.7 }}>
        <LottieAnimation
          src={LOADING_LOTTIE_URL}
          loop={true}
          autoplay={true}
          className="final-lottie"
        />
      </div>
      <h3 className="final-title">Account Already Exists</h3>
      <p className="final-message">
        An account with <strong>{email}</strong> already exists.
      </p>
      <p className="final-sub-message">
        Please log in to continue with your market research request.
      </p>
      <button
        type="button"
        className="nav-next-button"
        onClick={onLoginClick}
        style={{ marginTop: '1rem' }}
      >
        Log In
      </button>
    </div>
  );
}

export function NavigationButtons({ showBack, onBack, onNext, nextLabel, isLoading = false }) {
  return (
    <div className="nav-container">
      {showBack && (
        <button
          type="button"
          className="nav-back-button"
          onClick={onBack}
          disabled={isLoading}
          aria-label="Go back"
        >
          &larr; Back
        </button>
      )}
      <button
        type="button"
        className="nav-next-button"
        onClick={onNext}
        disabled={isLoading}
        aria-label={nextLabel}
      >
        {isLoading ? (
          <>
            <span className="nav-spinner" />
            Processing...
          </>
        ) : (
          nextLabel
        )}
      </button>
    </div>
  );
}
