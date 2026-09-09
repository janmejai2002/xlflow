import React, { useState, useEffect, useRef } from 'react';
import { Search, User, X, Check, ArrowRight, Sparkles } from 'lucide-react';
import { searchRoster } from '../data/rosterData';

export default function BatchSearchModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (query.trim()) {
      setResults(searchRoster(query));
    } else {
      setResults(searchRoster('34')); // Initial sample suggestions
    }
  }, [query]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(21, 24, 29, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '16px',
        paddingTop: '60px',
        zIndex: 100
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '460px',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeIn 0.15s ease-out'
      }}>
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)'
        }}>
          <Search size={18} style={{ color: 'var(--ink-soft)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search 178 batchmates by name or roll (e.g. 349, Janmejai)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              background: 'none',
              color: 'var(--ink)',
              fontSize: '14px',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <button
            onClick={onClose}
            aria-label="Close search"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div style={{
          maxHeight: '360px',
          overflowY: 'auto',
          padding: '8px'
        }}>
          {results.map(student => {
            const isSelected = selectedStudent?.rollNo === student.rollNo;

            return (
              <div
                key={student.rollNo}
                onClick={() => setSelectedStudent(student)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? 'var(--wash-mizu)' : 'transparent',
                  border: isSelected ? '1px solid rgba(0, 169, 184, 0.3)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.12s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--paper)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--indigo)',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    {student.section}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                      {student.name}
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                      {student.rollNo} • Section {student.section}
                    </span>
                  </div>
                </div>

                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--mizu)',
                  backgroundColor: 'var(--paper)',
                  border: '1px solid var(--border)',
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}>
                  View Schedule
                </span>
              </div>
            );
          })}

          {results.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-soft)', fontSize: '13px' }}>
              No batchmate found matching "{query}".
            </div>
          )}
        </div>

        {/* Selected Student Preview Drawer */}
        {selectedStudent && (
          <div style={{
            padding: '14px 16px',
            backgroundColor: 'var(--paper)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Viewing Schedule For:</span>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                {selectedStudent.name} ({selectedStudent.rollNo})
              </div>
              <span style={{ fontSize: '11px', color: 'var(--moss)', fontWeight: 600 }}>
                Eligible for Section {selectedStudent.section} Elective Streams
              </span>
            </div>

            <button
              onClick={onClose}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--ink)',
                color: 'var(--paper)',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
