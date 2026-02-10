import { useEffect, useState } from 'react';
import { validateTokenAndFetchUser } from '../../../lib/auth/index.js';
import DesktopHeader from './components/DesktopHeader.jsx';
import MobileHeader from './components/MobileHeader.jsx';
import { getCurrentPage } from './config/navigationConfig.js';
import './AdminHeader.css';

export default function AdminHeader({
  user: userProp = null,
  currentPath: currentPathProp = window.location.pathname,
  showCTA = false,
  ctaText = 'Change Prices',
  onCTAClick = () => {},
  className = '',
}) {
  const [user, setUser] = useState(userProp);
  const [currentPath, setCurrentPath] = useState(currentPathProp);
  const [isLoading, setIsLoading] = useState(userProp === null);

  useEffect(() => {
    let isMounted = true;

    async function fetchUser() {
      if (userProp !== null) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await validateTokenAndFetchUser({ clearOnFailure: false });
        if (isMounted) {
          setUser(userData);
        }
      } catch (err) {
        console.error('[AdminHeader] Failed to fetch user:', err);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, [userProp]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const currentPage = getCurrentPage(currentPath);

  if (isLoading) {
    return <div className="admin-header admin-header--loading">Loading...</div>;
  }

  return (
    <header className={`admin-header ${className}`.trim()} role="banner">
      <DesktopHeader
        currentPath={currentPath}
        currentPage={currentPage}
        user={user}
        showCTA={showCTA}
        ctaText={ctaText}
        onCTAClick={onCTAClick}
      />
      <MobileHeader user={user} currentPath={currentPath} />
    </header>
  );
}
