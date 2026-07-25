import { useEffect, useState } from 'react';

export function useMediaQuery(query: string) {
  const getMatches = () => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    const updateMatches = (event: MediaQueryListEvent) => setMatches(event.matches);

    setMatches(mediaQueryList.matches);
    mediaQueryList.addEventListener('change', updateMatches);

    return () => mediaQueryList.removeEventListener('change', updateMatches);
  }, [query]);

  return matches;
}