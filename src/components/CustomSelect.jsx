import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

/**
 * CustomSelect
 * Beautifully styled custom dropdown component that always drops DOWNWARDS,
 * features a scrollable option list with custom scrollbars, and enforces
 * clear visual hierarchy.
 *
 * @param {Array} options - array of primitives or { value, label, sublabel, disabled }
 * @param {any} value - current selected value
 * @param {function} onChange - callback when selection changes
 * @param {string} placeholder - placeholder when no value is selected
 * @param {boolean} disabled - disabled state
 * @param {string} className - wrapper class
 * @param {string} triggerClassName - trigger button class
 * @param {boolean} searchable - show search filter when options list is long
 * @param {string} emptyMessage - text when list is empty
 */
export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  className = '',
  triggerClassName = '',
  searchable = false,
  emptyMessage = 'No options available'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options to [{ value, label, sublabel, disabled }]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value,
        label: opt.label !== undefined ? String(opt.label) : String(opt.value),
        sublabel: opt.sublabel || null,
        disabled: Boolean(opt.disabled)
      };
    }
    return {
      value: opt,
      label: String(opt),
      sublabel: null,
      disabled: false
    };
  });

  // Find active option label
  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  // Filter options if searchable
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return opt.label.toLowerCase().includes(q) || (opt.sublabel && opt.sublabel.toLowerCase().includes(q));
  });

  // Enable search automatically if there are 8 or more options unless explicitly set to false
  const shouldShowSearch = searchable || (options.length >= 8 && searchable !== false);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && shouldShowSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, shouldShowSearch]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val, isDisabled) => {
    if (isDisabled) return;
    if (onChange) {
      onChange(val);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`form-select-trigger ${
          isOpen ? 'ring-2 ring-brand-primary border-brand-primary' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-gray-400'} ${triggerClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex-1 truncate mr-2">
          {selectedOption ? (
            <div className="flex items-baseline gap-2 truncate">
              <span className="font-medium text-slate-800 text-sm truncate">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-xs text-brand-neutral-muted truncate font-normal">
                  {selectedOption.sublabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-normal">
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180 text-brand-primary' : ''
          }`}
        />
      </button>

      {/* Downward-Opening Scrollable Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
          role="listbox"
        >
          {/* Optional Search Input */}
          {shouldShowSearch && (
            <div className="p-2 border-b border-gray-100 bg-slate-50/70">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Filter options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary text-slate-800 placeholder:text-gray-400 font-normal"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Scrollable Options List */}
          <div className="max-h-56 overflow-y-auto py-1 divide-y divide-gray-50 focus:outline-none custom-select-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-center text-xs text-brand-neutral-muted italic">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value, opt.disabled)}
                    className={`px-3.5 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed bg-gray-50'
                        : isSelected
                        ? 'bg-brand-primary-light/70 text-brand-primary font-medium'
                        : 'text-slate-800 hover:bg-slate-100/70 hover:text-brand-primary'
                    }`}
                  >
                    <div className="flex-1 truncate pr-2">
                      <div className="text-sm font-medium leading-tight truncate">
                        {opt.label}
                      </div>
                      {opt.sublabel && (
                        <div className="text-[11px] text-brand-neutral-muted font-normal mt-0.5 leading-tight truncate">
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-brand-primary flex-shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
