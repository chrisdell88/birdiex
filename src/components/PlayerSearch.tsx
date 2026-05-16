import { useState, useRef, useEffect, useCallback, useId } from 'react';

interface PlayerSearchProps {
  /** Full list of player name strings to search against. */
  players: string[];
  /** Currently selected player name, or null when cleared. */
  selected: string | null;
  /** Called with the chosen name when the user selects a player. */
  onSelect: (name: string) => void;
  /** Called when the user clears the selection. */
  onClear: () => void;
  /** Placeholder shown in the input when nothing is typed/selected. */
  placeholder?: string;
}

/**
 * Type-ahead player search combobox.
 *
 * - Input drives a case-insensitive substring filter.
 * - Matching names appear in a dropdown below.
 * - Clicking a name fires onSelect and closes the dropdown.
 * - The X button clears the selection and fires onClear.
 * - Keyboard: ArrowUp/Down moves highlight, Enter selects, Escape closes.
 * - Closes on outside click.
 */
export default function PlayerSearch({
  players,
  selected,
  onSelect,
  onClear,
  placeholder = 'Search player...',
}: PlayerSearchProps) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Derived: filtered names
  const matches = query.trim()
    ? players.filter((n) =>
        n.toLowerCase().includes(query.trim().toLowerCase())
      )
    : players;

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[highlighted] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  const handleSelect = useCallback(
    (name: string) => {
      onSelect(name);
      setQuery('');
      setOpen(false);
    },
    [onSelect]
  );

  const handleClear = useCallback(() => {
    onClear();
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  }, [onClear]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, matches.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (matches[highlighted]) handleSelect(matches[highlighted]);
        break;
      case 'Escape':
        setOpen(false);
        break;
    }
  };

  // Display value: selected name if set and not actively typing, else query
  const inputValue = selected && !query ? selected : query;

  return (
    <div ref={containerRef} className="relative w-full sm:w-56">
      {/* Input row */}
      <div className="relative flex items-center">
        {/* Search icon */}
        <svg
          className="absolute left-3 w-3.5 h-3.5 text-[#a1a1aa] pointer-events-none shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
            clipRule="evenodd"
          />
        </svg>

        <input
          ref={inputRef}
          id={`${id}-input`}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={`${id}-listbox`}
          aria-activedescendant={open && matches[highlighted] ? `${id}-option-${highlighted}` : undefined}
          type="text"
          value={inputValue}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlighted(0);
            setOpen(true);
            // If user starts typing after a selection, clear the selection display
            if (selected) onClear();
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={`w-full bg-[#0a0a0a] border rounded-lg pl-8 pr-8 py-2 text-sm text-[#f5f5f5] placeholder-[#a1a1aa] focus:outline-none transition-colors font-['Inter',system-ui,sans-serif] ${
            selected
              ? 'border-[#22c55e] text-[#22c55e]'
              : 'border-[#262626] focus:border-[#22c55e]'
          }`}
        />

        {/* Clear button — only visible when something is selected or typed */}
        {(selected || query) && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear player filter"
            className="absolute right-2.5 flex items-center justify-center w-4 h-4 rounded-full text-[#a1a1aa] hover:text-[#f5f5f5] hover:bg-[#262626] transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-3 h-3"
              aria-hidden="true"
            >
              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && matches.length > 0 && (
        <ul
          ref={listRef}
          id={`${id}-listbox`}
          role="listbox"
          aria-label="Player suggestions"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-[#111111] border border-[#262626] rounded-lg shadow-xl py-1"
        >
          {matches.map((name, i) => (
            <li
              key={name}
              id={`${id}-option-${i}`}
              role="option"
              aria-selected={i === highlighted}
              onMouseEnter={() => setHighlighted(i)}
              onMouseDown={(e) => {
                // Prevent the input blur from closing the dropdown before click fires
                e.preventDefault();
                handleSelect(name);
              }}
              className={`px-3 py-2 text-sm cursor-pointer font-['Inter',system-ui,sans-serif] transition-colors ${
                i === highlighted
                  ? 'bg-[#22c55e]/15 text-[#22c55e]'
                  : 'text-[#d4d4d4] hover:bg-[#1a1a1a]'
              }`}
            >
              {name}
            </li>
          ))}
        </ul>
      )}

      {/* No-results message */}
      {open && query.trim() && matches.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-[#111111] border border-[#262626] rounded-lg shadow-xl px-3 py-3 text-sm text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
          No players match &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
