import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModalManager } from '../useModalManager.js';

describe('useModalManager', () => {
  // ========================================
  // SINGLE MODAL MODE (default)
  // ========================================
  describe('Single modal mode (default)', () => {
    it('starts with no modals open', () => {
      const { result } = renderHook(() => useModalManager());
      expect(result.current.isOpen('anything')).toBe(false);
      expect(result.current.openModal).toBeNull();
    });

    it('opens a modal by name', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.open('review');
      });

      expect(result.current.isOpen('review')).toBe(true);
      expect(result.current.openModal).toBe('review');
    });

    it('opening modal B closes modal A', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.open('review');
      });
      expect(result.current.isOpen('review')).toBe(true);

      act(() => {
        result.current.open('dateChange');
      });
      expect(result.current.isOpen('dateChange')).toBe(true);
      expect(result.current.isOpen('review')).toBe(false);
      expect(result.current.openModal).toBe('dateChange');
    });

    it('opening the same modal again keeps it open', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.open('review');
      });
      act(() => {
        result.current.open('review');
      });

      expect(result.current.isOpen('review')).toBe(true);
    });
  });

  // ========================================
  // MULTI-MODAL MODE
  // ========================================
  describe('Multi-modal mode (allowMultiple: true)', () => {
    it('keeps both modals A and B open', () => {
      const { result } = renderHook(() => useModalManager({ allowMultiple: true }));

      act(() => {
        result.current.open('review');
      });
      act(() => {
        result.current.open('dateChange');
      });

      expect(result.current.isOpen('review')).toBe(true);
      expect(result.current.isOpen('dateChange')).toBe(true);
    });

    it('closing one does not affect others', () => {
      const { result } = renderHook(() => useModalManager({ allowMultiple: true }));

      act(() => {
        result.current.open('review');
        result.current.open('dateChange');
      });

      act(() => {
        result.current.close('review');
      });

      expect(result.current.isOpen('review')).toBe(false);
      expect(result.current.isOpen('dateChange')).toBe(true);
    });
  });

  // ========================================
  // DATA PAYLOADS
  // ========================================
  describe('Data payloads', () => {
    it('stores and retrieves data payload', () => {
      const { result } = renderHook(() => useModalManager());
      const stay = { id: 'stay-123', name: 'Test Stay' };

      act(() => {
        result.current.open('review', { stay });
      });

      expect(result.current.getData('review')).toEqual({ stay });
    });

    it('returns null for data of unopened modal', () => {
      const { result } = renderHook(() => useModalManager());
      expect(result.current.getData('nonexistent')).toBeNull();
    });

    it('clears data when modal is closed', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.open('review', { stay: { id: '1' } });
      });
      expect(result.current.getData('review')).not.toBeNull();

      act(() => {
        result.current.close('review');
      });
      expect(result.current.getData('review')).toBeNull();
    });

    it('replaces data when modal is re-opened with new data', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.open('review', { stay: { id: '1' } });
      });
      act(() => {
        result.current.open('review', { stay: { id: '2' } });
      });

      expect(result.current.getData('review')).toEqual({ stay: { id: '2' } });
    });

    it('defaults data to null when opened without payload', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.open('review');
      });

      expect(result.current.getData('review')).toBeNull();
    });
  });

  // ========================================
  // CLOSE
  // ========================================
  describe('close()', () => {
    it('closes an open modal', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.open('review');
      });
      act(() => {
        result.current.close('review');
      });

      expect(result.current.isOpen('review')).toBe(false);
      expect(result.current.openModal).toBeNull();
    });

    it('is a no-op for nonexistent modal', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.open('review');
      });

      // Should not throw or affect existing open modal
      act(() => {
        result.current.close('nonexistent');
      });

      expect(result.current.isOpen('review')).toBe(true);
    });

    it('clears openModal ref when closing the current modal', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.open('review');
      });
      expect(result.current.openModal).toBe('review');

      act(() => {
        result.current.close('review');
      });
      expect(result.current.openModal).toBeNull();
    });

    it('does not clear openModal ref when closing a non-current modal', () => {
      const { result } = renderHook(() => useModalManager({ allowMultiple: true }));

      act(() => {
        result.current.open('first');
      });
      act(() => {
        result.current.open('second');
      });
      // openModal ref tracks most recently opened = 'second'
      expect(result.current.openModal).toBe('second');

      act(() => {
        result.current.close('first');
      });
      // Should still be 'second' since we closed 'first'
      expect(result.current.openModal).toBe('second');
    });
  });

  // ========================================
  // CLOSE ALL
  // ========================================
  describe('closeAll()', () => {
    it('closes all open modals', () => {
      const { result } = renderHook(() => useModalManager({ allowMultiple: true }));

      act(() => {
        result.current.open('review');
        result.current.open('dateChange');
        result.current.open('confirm');
      });

      act(() => {
        result.current.closeAll();
      });

      expect(result.current.isOpen('review')).toBe(false);
      expect(result.current.isOpen('dateChange')).toBe(false);
      expect(result.current.isOpen('confirm')).toBe(false);
      expect(result.current.openModal).toBeNull();
    });

    it('is safe to call with no modals open', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.closeAll();
      });

      expect(result.current.openModal).toBeNull();
    });
  });

  // ========================================
  // TOGGLE
  // ========================================
  describe('toggle()', () => {
    it('opens a closed modal', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.toggle('review');
      });

      expect(result.current.isOpen('review')).toBe(true);
    });

    it('closes an open modal', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.open('review');
      });
      act(() => {
        result.current.toggle('review');
      });

      expect(result.current.isOpen('review')).toBe(false);
    });

    it('passes data when toggling open', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.toggle('review', { stay: { id: '1' } });
      });

      expect(result.current.isOpen('review')).toBe(true);
      expect(result.current.getData('review')).toEqual({ stay: { id: '1' } });
    });

    it('in single mode, toggling B open closes A', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.open('review');
      });
      act(() => {
        result.current.toggle('dateChange');
      });

      expect(result.current.isOpen('review')).toBe(false);
      expect(result.current.isOpen('dateChange')).toBe(true);
    });

    it('in multi mode, toggling B open keeps A open', () => {
      const { result } = renderHook(() => useModalManager({ allowMultiple: true }));

      act(() => {
        result.current.open('review');
      });
      act(() => {
        result.current.toggle('dateChange');
      });

      expect(result.current.isOpen('review')).toBe(true);
      expect(result.current.isOpen('dateChange')).toBe(true);
    });
  });

  // ========================================
  // EDGE CASES
  // ========================================
  describe('Edge cases', () => {
    it('getData for nonexistent modal returns null', () => {
      const { result } = renderHook(() => useModalManager());
      expect(result.current.getData('doesNotExist')).toBeNull();
    });

    it('isOpen for nonexistent modal returns false', () => {
      const { result } = renderHook(() => useModalManager());
      expect(result.current.isOpen('doesNotExist')).toBe(false);
    });

    it('close on nonexistent modal is a no-op', () => {
      const { result } = renderHook(() => useModalManager());

      // Should not throw
      act(() => {
        result.current.close('doesNotExist');
      });

      expect(result.current.openModal).toBeNull();
    });

    it('returns all expected API methods', () => {
      const { result } = renderHook(() => useModalManager());

      expect(typeof result.current.open).toBe('function');
      expect(typeof result.current.close).toBe('function');
      expect(typeof result.current.closeAll).toBe('function');
      expect(typeof result.current.toggle).toBe('function');
      expect(typeof result.current.isOpen).toBe('function');
      expect(typeof result.current.getData).toBe('function');
      expect(result.current).toHaveProperty('openModal');
    });
  });
});
