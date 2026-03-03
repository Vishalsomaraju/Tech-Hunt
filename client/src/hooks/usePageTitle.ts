// ============================================================================
// TECH HUNT — usePageTitle Hook
// Sets document.title on mount and restores the default on unmount.
// ============================================================================

import { useEffect } from "react";

const DEFAULT_TITLE = "TECH HUNT";

export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} — ${DEFAULT_TITLE}`;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
}
