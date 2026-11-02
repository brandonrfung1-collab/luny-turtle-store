import { useEffect } from 'react';

/** Sets the browser tab title while a page is mounted, then puts the previous one back. */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
