import { useEffect } from 'react';

export function useKeyboardShortcuts({
  onSelectTab,
  onOpenSearch,
  onToggleTheme,
  onOpenShortcuts,
  onOpenCopilot,
  onToggleLayoutMode
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore when inside input, textarea, or contentEditable
      const tag = e.target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) {
        return;
      }

      // Check for modifier keys
      const hasModifier = e.ctrlKey || e.metaKey || e.altKey;

      if (!hasModifier) {
        if (e.key === '1') {
          e.preventDefault();
          onSelectTab?.('radar');
        } else if (e.key === '2') {
          e.preventDefault();
          onSelectTab?.('bunkmeter');
        } else if (e.key === '3') {
          e.preventDefault();
          onSelectTab?.('timetable');
        } else if (e.key === '4') {
          e.preventDefault();
          onSelectTab?.('trips');
        } else if (e.key === '5') {
          e.preventDefault();
          onSelectTab?.('deadlines');
        } else if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          onToggleTheme?.();
        } else if (e.key.toLowerCase() === 'v') {
          e.preventDefault();
          onToggleLayoutMode?.();
        } else if (e.key === '?') {
          e.preventDefault();
          onOpenShortcuts?.();
        }
      }

      // Command + K or Ctrl + K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenSearch?.();
      }

      // Command + \ or Ctrl + \ (Toggle AI Copilot)
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        onOpenCopilot?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectTab, onOpenSearch, onToggleTheme, onOpenShortcuts, onOpenCopilot]);
}
