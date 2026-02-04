import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DayButton } from './DayButton.jsx';

describe('DayButton Component', () => {
  // Default test props
  const defaultDay = {
    name: 'Monday',
    singleLetter: 'M',
    isAvailable: true,
    index: 1
  };

  const defaultProps = {
    day: defaultDay,
    isSelected: false,
    isClickable: true,
    onClick: vi.fn()
  };

  // ========================================
  // RENDERING TESTS
  // ========================================
  describe('Rendering', () => {
    it('renders the day single letter', () => {
      render(<DayButton {...defaultProps} />);
      expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('renders as a button element', () => {
      render(<DayButton {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders with type="button" attribute', () => {
      render(<DayButton {...defaultProps} />);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('renders title attribute with day name', () => {
      render(<DayButton {...defaultProps} />);
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Monday');
    });
  });

  // ========================================
  // SELECTION STATE TESTS
  // ========================================
  describe('Selection State', () => {
    it('applies selected class when isSelected is true', () => {
      render(<DayButton {...defaultProps} isSelected={true} />);
      expect(screen.getByRole('button')).toHaveClass('selected');
    });

    it('does not apply selected class when isSelected is false', () => {
      render(<DayButton {...defaultProps} isSelected={false} />);
      expect(screen.getByRole('button')).not.toHaveClass('selected');
    });

    it('sets aria-pressed to true when selected', () => {
      render(<DayButton {...defaultProps} isSelected={true} />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });

    it('sets aria-pressed to false when not selected', () => {
      render(<DayButton {...defaultProps} isSelected={false} />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  // ========================================
  // AVAILABILITY STATE TESTS
  // ========================================
  describe('Availability State', () => {
    it('applies disabled class when day is not available', () => {
      const unavailableDay = { ...defaultDay, isAvailable: false };
      render(<DayButton {...defaultProps} day={unavailableDay} />);
      expect(screen.getByRole('button')).toHaveClass('disabled');
    });

    it('does not apply disabled class when day is available', () => {
      render(<DayButton {...defaultProps} />);
      expect(screen.getByRole('button')).not.toHaveClass('disabled');
    });

    it('disables button when day is not available', () => {
      const unavailableDay = { ...defaultDay, isAvailable: false };
      render(<DayButton {...defaultProps} day={unavailableDay} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('enables button when day is available', () => {
      render(<DayButton {...defaultProps} />);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  // ========================================
  // CLICKABLE STATE TESTS
  // ========================================
  describe('Clickable State', () => {
    it('applies not-clickable class when isClickable is false', () => {
      render(<DayButton {...defaultProps} isClickable={false} />);
      expect(screen.getByRole('button')).toHaveClass('not-clickable');
    });

    it('does not apply not-clickable class when isClickable is true', () => {
      render(<DayButton {...defaultProps} isClickable={true} />);
      expect(screen.getByRole('button')).not.toHaveClass('not-clickable');
    });

    it('disables button when isClickable is false', () => {
      render(<DayButton {...defaultProps} isClickable={false} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  // ========================================
  // CLICK HANDLER TESTS
  // ========================================
  describe('Click Handling', () => {
    it('calls onClick with day when clicked and available and clickable', async () => {
      const handleClick = vi.fn();
      render(<DayButton {...defaultProps} onClick={handleClick} />);

      await userEvent.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(defaultDay);
    });

    it('does not call onClick when day is not available', async () => {
      const handleClick = vi.fn();
      const unavailableDay = { ...defaultDay, isAvailable: false };
      render(<DayButton {...defaultProps} day={unavailableDay} onClick={handleClick} />);

      const button = screen.getByRole('button');
      // Using fireEvent because userEvent.click respects disabled
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when not clickable', async () => {
      const handleClick = vi.fn();
      render(<DayButton {...defaultProps} isClickable={false} onClick={handleClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when both unavailable and not clickable', async () => {
      const handleClick = vi.fn();
      const unavailableDay = { ...defaultDay, isAvailable: false };
      render(
        <DayButton
          {...defaultProps}
          day={unavailableDay}
          isClickable={false}
          onClick={handleClick}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // CSS CLASSES TESTS
  // ========================================
  describe('CSS Classes', () => {
    it('always applies day-button base class', () => {
      render(<DayButton {...defaultProps} />);
      expect(screen.getByRole('button')).toHaveClass('day-button');
    });

    it('combines multiple state classes correctly', () => {
      const unavailableDay = { ...defaultDay, isAvailable: false };
      render(
        <DayButton
          {...defaultProps}
          day={unavailableDay}
          isSelected={true}
          isClickable={false}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('day-button');
      expect(button).toHaveClass('selected');
      expect(button).toHaveClass('disabled');
      expect(button).toHaveClass('not-clickable');
    });
  });

  // ========================================
  // ACCESSIBILITY TESTS
  // ========================================
  describe('Accessibility', () => {
    it('has correct aria-label for unselected day', () => {
      render(<DayButton {...defaultProps} isSelected={false} />);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Monday, not selected'
      );
    });

    it('has correct aria-label for selected day', () => {
      render(<DayButton {...defaultProps} isSelected={true} />);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Monday, selected'
      );
    });

    it('is focusable when enabled', () => {
      render(<DayButton {...defaultProps} />);
      const button = screen.getByRole('button');

      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('is not focusable when disabled', () => {
      const unavailableDay = { ...defaultDay, isAvailable: false };
      render(<DayButton {...defaultProps} day={unavailableDay} />);

      const button = screen.getByRole('button');
      button.focus();

      expect(document.activeElement).not.toBe(button);
    });

    it('can be activated with keyboard when enabled', async () => {
      const handleClick = vi.fn();
      render(<DayButton {...defaultProps} onClick={handleClick} />);

      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalled();
    });

    it('can be activated with space key', async () => {
      const handleClick = vi.fn();
      render(<DayButton {...defaultProps} onClick={handleClick} />);

      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard(' ');

      expect(handleClick).toHaveBeenCalled();
    });
  });

  // ========================================
  // DIFFERENT DAYS TESTS
  // ========================================
  describe('Different Days', () => {
    const days = [
      { name: 'Sunday', singleLetter: 'S', index: 0 },
      { name: 'Monday', singleLetter: 'M', index: 1 },
      { name: 'Tuesday', singleLetter: 'T', index: 2 },
      { name: 'Wednesday', singleLetter: 'W', index: 3 },
      { name: 'Thursday', singleLetter: 'T', index: 4 },
      { name: 'Friday', singleLetter: 'F', index: 5 },
      { name: 'Saturday', singleLetter: 'S', index: 6 }
    ];

    days.forEach(({ name, singleLetter, index }) => {
      it(`renders ${name} correctly`, () => {
        const day = { name, singleLetter, isAvailable: true, index };
        render(<DayButton {...defaultProps} day={day} />);

        expect(screen.getByText(singleLetter)).toBeInTheDocument();
        expect(screen.getByRole('button')).toHaveAttribute('title', name);
      });
    });
  });

  // ========================================
  // DISABLED STATE COMBINATIONS
  // ========================================
  describe('Disabled State Combinations', () => {
    it('is disabled when only unavailable', () => {
      const unavailableDay = { ...defaultDay, isAvailable: false };
      render(<DayButton {...defaultProps} day={unavailableDay} isClickable={true} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is disabled when only not clickable', () => {
      render(<DayButton {...defaultProps} isClickable={false} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is disabled when both unavailable and not clickable', () => {
      const unavailableDay = { ...defaultDay, isAvailable: false };
      render(<DayButton {...defaultProps} day={unavailableDay} isClickable={false} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is enabled when both available and clickable', () => {
      render(<DayButton {...defaultProps} />);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  // ========================================
  // EDGE CASES
  // ========================================
  describe('Edge Cases', () => {
    it('handles day with special characters in name', () => {
      const specialDay = {
        name: "New Year's Day",
        singleLetter: 'N',
        isAvailable: true,
        index: 0
      };
      render(<DayButton {...defaultProps} day={specialDay} />);

      expect(screen.getByRole('button')).toHaveAttribute('title', "New Year's Day");
    });

    it('handles empty single letter', () => {
      const emptyLetterDay = {
        name: 'Monday',
        singleLetter: '',
        isAvailable: true,
        index: 1
      };
      render(<DayButton {...defaultProps} day={emptyLetterDay} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles multiple character single letter', () => {
      const multiCharDay = {
        name: 'Thursday',
        singleLetter: 'Th',
        isAvailable: true,
        index: 4
      };
      render(<DayButton {...defaultProps} day={multiCharDay} />);

      expect(screen.getByText('Th')).toBeInTheDocument();
    });
  });
});
