/**
 * Tests for NotificationToggle
 *
 * Tests the iOS-style toggle switch component including:
 * - Rendering states (checked/unchecked)
 * - User interactions
 * - Accessibility features
 * - Disabled state handling
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationToggle from '../NotificationToggle.jsx';

describe('NotificationToggle', () => {
  // ============================================================================
  // Rendering Tests
  // ============================================================================
  describe('rendering', () => {
    it('should render a checkbox input', () => {
      render(<NotificationToggle />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('should render with switch role element', () => {
      render(<NotificationToggle />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
    });

    it('should render with correct toggle class', () => {
      const { container } = render(<NotificationToggle />);
      const toggle = container.querySelector('.notification-toggle');
      expect(toggle).toBeInTheDocument();
    });

    it('should render slider element', () => {
      const { container } = render(<NotificationToggle />);
      const slider = container.querySelector('.notification-toggle-slider');
      expect(slider).toBeInTheDocument();
    });

    it('should render knob element', () => {
      const { container } = render(<NotificationToggle />);
      const knob = container.querySelector('.notification-toggle-knob');
      expect(knob).toBeInTheDocument();
    });

    it('should show checked state with correct class', () => {
      const { container } = render(<NotificationToggle checked={true} />);
      const slider = container.querySelector('.notification-toggle-slider');
      expect(slider).toHaveClass('notification-toggle-slider--checked');
    });

    it('should show unchecked state without checked class', () => {
      const { container } = render(<NotificationToggle checked={false} />);
      const slider = container.querySelector('.notification-toggle-slider');
      expect(slider).not.toHaveClass('notification-toggle-slider--checked');
    });

    it('should position knob correctly based on enabled state - checked', () => {
      const { container } = render(<NotificationToggle checked={true} />);
      const knob = container.querySelector('.notification-toggle-knob');
      expect(knob).toHaveClass('notification-toggle-knob--checked');
    });

    it('should position knob correctly based on enabled state - unchecked', () => {
      const { container } = render(<NotificationToggle checked={false} />);
      const knob = container.querySelector('.notification-toggle-knob');
      expect(knob).not.toHaveClass('notification-toggle-knob--checked');
    });
  });

  // ============================================================================
  // Interaction Tests
  // ============================================================================
  describe('interactions', () => {
    it('should call onChange when clicked', async () => {
      const handleChange = vi.fn();
      render(<NotificationToggle checked={false} onChange={handleChange} />);

      const checkbox = screen.getByRole('checkbox');
      await userEvent.click(checkbox);

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('should call onChange with false when toggling off', async () => {
      const handleChange = vi.fn();
      render(<NotificationToggle checked={true} onChange={handleChange} />);

      const checkbox = screen.getByRole('checkbox');
      await userEvent.click(checkbox);

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(false);
    });

    it('should not call onChange when disabled', async () => {
      const handleChange = vi.fn();
      render(
        <NotificationToggle checked={false} onChange={handleChange} disabled={true} />
      );

      const checkbox = screen.getByRole('checkbox');
      await userEvent.click(checkbox);

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should show disabled state with correct class', () => {
      const { container } = render(<NotificationToggle disabled={true} />);
      const slider = container.querySelector('.notification-toggle-slider');
      expect(slider).toHaveClass('notification-toggle-slider--disabled');
    });

    it('should handle missing onChange gracefully', async () => {
      render(<NotificationToggle checked={false} />);
      const checkbox = screen.getByRole('checkbox');

      // Should not throw
      await expect(userEvent.click(checkbox)).resolves.not.toThrow();
    });

    it('should call onChange on label click', async () => {
      const handleChange = vi.fn();
      const { container } = render(
        <NotificationToggle checked={false} onChange={handleChange} />
      );

      const label = container.querySelector('.notification-toggle');
      await userEvent.click(label);

      expect(handleChange).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================
  describe('accessibility', () => {
    it('should have role="switch"', () => {
      render(<NotificationToggle />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
    });

    it('should have aria-checked matching enabled state when checked', () => {
      render(<NotificationToggle checked={true} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('should have aria-checked matching enabled state when unchecked', () => {
      render(<NotificationToggle checked={false} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });

    it('should have default aria-label', () => {
      render(<NotificationToggle />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-label', 'Toggle notification');
    });

    it('should accept custom aria-label', () => {
      render(<NotificationToggle ariaLabel="Custom label" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-label', 'Custom label');
    });

    it('should be keyboard accessible - Enter key', async () => {
      const handleChange = vi.fn();
      render(<NotificationToggle checked={false} onChange={handleChange} />);

      const switchElement = screen.getByRole('switch');
      switchElement.focus();
      await userEvent.keyboard('{Enter}');

      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('should be keyboard accessible - Space key', async () => {
      const handleChange = vi.fn();
      render(<NotificationToggle checked={false} onChange={handleChange} />);

      const switchElement = screen.getByRole('switch');
      switchElement.focus();
      await userEvent.keyboard(' ');

      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('should not respond to keyboard when disabled', async () => {
      const handleChange = vi.fn();
      render(
        <NotificationToggle checked={false} onChange={handleChange} disabled={true} />
      );

      const switchElement = screen.getByRole('switch');
      switchElement.focus();
      await userEvent.keyboard('{Enter}');

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should have tabIndex 0 when not disabled', () => {
      render(<NotificationToggle disabled={false} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('tabIndex', '0');
    });

    it('should have tabIndex -1 when disabled', () => {
      render(<NotificationToggle disabled={true} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('tabIndex', '-1');
    });

    it('should be focusable when not disabled', () => {
      render(<NotificationToggle disabled={false} />);
      const switchElement = screen.getByRole('switch');

      switchElement.focus();
      expect(document.activeElement).toBe(switchElement);
    });
  });

  // ============================================================================
  // State Management Tests
  // ============================================================================
  describe('state management', () => {
    it('should reflect checked prop in checkbox state', () => {
      const { rerender } = render(<NotificationToggle checked={false} />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).not.toBeChecked();

      rerender(<NotificationToggle checked={true} />);
      expect(checkbox).toBeChecked();
    });

    it('should reflect disabled prop in checkbox state', () => {
      const { rerender } = render(<NotificationToggle disabled={false} />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).not.toBeDisabled();

      rerender(<NotificationToggle disabled={true} />);
      expect(checkbox).toBeDisabled();
    });

    it('should handle rapid toggling', async () => {
      const handleChange = vi.fn();
      render(<NotificationToggle checked={false} onChange={handleChange} />);

      const checkbox = screen.getByRole('checkbox');

      await userEvent.click(checkbox);
      await userEvent.click(checkbox);
      await userEvent.click(checkbox);

      // Each click should fire the callback
      expect(handleChange).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================================================
  // Default Props Tests
  // ============================================================================
  describe('default props', () => {
    it('should default checked to false', () => {
      render(<NotificationToggle />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('should default disabled to false', () => {
      render(<NotificationToggle />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeDisabled();
    });

    it('should default ariaLabel to "Toggle notification"', () => {
      render(<NotificationToggle />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-label', 'Toggle notification');
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle undefined checked prop', () => {
      render(<NotificationToggle checked={undefined} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('should handle null onChange prop', async () => {
      render(<NotificationToggle checked={false} onChange={null} />);
      const checkbox = screen.getByRole('checkbox');

      // Should not throw
      await expect(userEvent.click(checkbox)).resolves.not.toThrow();
    });

    it('should render correctly with both checked and disabled true', () => {
      const { container } = render(
        <NotificationToggle checked={true} disabled={true} />
      );
      const slider = container.querySelector('.notification-toggle-slider');
      const checkbox = screen.getByRole('checkbox');

      expect(slider).toHaveClass('notification-toggle-slider--checked');
      expect(slider).toHaveClass('notification-toggle-slider--disabled');
      expect(checkbox).toBeChecked();
      expect(checkbox).toBeDisabled();
    });

    it('should handle very long aria-label', () => {
      const longLabel =
        'This is a very long aria label that describes the toggle in great detail for accessibility purposes';
      render(<NotificationToggle ariaLabel={longLabel} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-label', longLabel);
    });
  });

  // ============================================================================
  // Combined State Tests
  // ============================================================================
  describe('combined states', () => {
    it('should combine checked and not disabled states correctly', () => {
      const { container } = render(
        <NotificationToggle checked={true} disabled={false} />
      );
      const slider = container.querySelector('.notification-toggle-slider');
      const knob = container.querySelector('.notification-toggle-knob');

      expect(slider).toHaveClass('notification-toggle-slider--checked');
      expect(slider).not.toHaveClass('notification-toggle-slider--disabled');
      expect(knob).toHaveClass('notification-toggle-knob--checked');
    });

    it('should combine unchecked and disabled states correctly', () => {
      const { container } = render(
        <NotificationToggle checked={false} disabled={true} />
      );
      const slider = container.querySelector('.notification-toggle-slider');
      const knob = container.querySelector('.notification-toggle-knob');

      expect(slider).not.toHaveClass('notification-toggle-slider--checked');
      expect(slider).toHaveClass('notification-toggle-slider--disabled');
      expect(knob).not.toHaveClass('notification-toggle-knob--checked');
    });
  });
});
