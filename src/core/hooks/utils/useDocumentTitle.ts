import { useEffect } from 'react';

export function useDocumentTitle(title: string, restoreOnUnmount = true) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    
    if (restoreOnUnmount) {
      return () => {
        document.title = prevTitle;
      };
    }
  }, [title, restoreOnUnmount]);
}