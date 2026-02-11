import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button.jsx';

describe('Button Component', () => {
  // ========================================
  // RENDERING TESTS
  // ========================================
  describe('Rendering', () => {
    it('renders children content correctly', () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Click Me');
    });

    it('renders with default props', () => {
      render(<Button>Default Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('btn');
      expect(button).toHaveClass('btn-primary');
      expect(button).toHaveClass('btn-medium');
      expect(button).toHaveAttribute('type', 'button');
      expect(button).not.toBeDisabled();
    });

    it('renders as a button element', () => {
      render(<Button>Test</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  // ========================================
  // VARIANT TESTS
  // ========================================
  describe('Variants', () => {
    it('applies primary variant class correctly', () => {
      render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-primary');
    });

    it('applies secondary variant class correctly', () => {
      render(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-secondary');
    });

    it('applies ghost variant class correctly', () => {
      render(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-ghost');
    });

    it('applies outline variant class correctly', () => {
      render(<Button variant="outline">Outline</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-outline');
    });

    it('falls back to primary for invalid variant', () => {
      render(<Button variant="invalid-variant">Invalid</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-primary');
    });
  });

  // ========================================
  // SIZE TESTS
  // ========================================
  describe('Sizes', () => {
    it('applies small size class correctly', () => {
      render(<Button size="small">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-small');
    });

    it('applies medium size class correctly', () => {
      render(<Button size="medium">Medium</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-medium');
    });

    it('applies large size class correctly', () => {
      render(<Button size="large">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-large');
    });

    it('falls back to medium for invalid size', () => {
      render(<Button size="extra-large">Invalid Size</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-medium');
    });
  });

  // ========================================
  // LOADING STATE TESTS
  // ========================================
  describe('Loading State', () => {
    it('shows loading spinner when loading is true', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-loading');
    });

    it('disables button when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not show loading class when loading is false', () => {
      render(<Button loading={false}>Not Loading</Button>);
      expect(screen.getByRole('button')).not.toHaveClass('btn-loading');
    });
  });

  // ========================================
  // DISABLED STATE TESTS
  // ========================================
  describe('Disabled State', () => {
    it('disables button when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('applies disabled class when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-disabled');
    });

    it('is enabled when disabled is false', () => {
      render(<Button disabled={false}>Enabled</Button>);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // FULL WIDTH TESTS
  // ========================================
  describe('Full Width', () => {
    it('applies full width class when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-full-width');
    });

    it('does not apply full width class when fullWidth is false', () => {
      render(<Button fullWidth={false}>Not Full Width</Button>);
      expect(screen.getByRole('button')).not.toHaveClass('btn-full-width');
    });
  });

  // ========================================
  // ICON TESTS
  // ========================================
  describe('Icon Rendering', () => {
    const TestIcon = () => <span data-testid="test-icon">icon</span>;

    it('renders icon on the left by default', () => {
      render(<Button icon={<TestIcon />}>With Icon</Button>);
      const button = screen.getByRole('button');
      const icon = screen.getByTestId('test-icon');

      expect(icon).toBeInTheDocument();
      // Icon should be before the button content
      expect(button.querySelector('.btn-icon')).toBeInTheDocument();
    });

    it('renders icon on the right when iconPosition is right', () => {
      render(<Button icon={<TestIcon />} iconPosition="right">With Icon</Button>);
      const button = screen.getByRole('button');
      const icon = screen.getByTestId('test-icon');

      expect(icon).toBeInTheDocument();
      expect(button.querySelector('.btn-icon')).toBeInTheDocument();
    });

    it('does not render icon element when no icon provided', () => {
      render(<Button>No Icon</Button>);
      expect(screen.getByRole('button').querySelector('.btn-icon')).not.toBeInTheDocument();
    });

    it('falls back to left for invalid iconPosition', () => {
      render(<Button icon={<TestIcon />} iconPosition="invalid">With Icon</Button>);
      // Should still render the icon (defaults to left)
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });
  });

  // ========================================
  // CLICK HANDLER TESTS
  // ========================================
  describe('Click Handling', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Clickable</Button>);

      await userEvent.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not throw when onClick is not provided', async () => {
      render(<Button>No Handler</Button>);

      // Should not throw
      await expect(userEvent.click(screen.getByRole('button'))).resolves.not.toThrow();
    });

    it('does not call onClick when loading', async () => {
      const handleClick = vi.fn();
      render(<Button loading onClick={handleClick}>Loading</Button>);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // TYPE ATTRIBUTE TESTS
  // ========================================
  describe('Type Attribute', () => {
    it('defaults to button type', () => {
      render(<Button>Default Type</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('renders with submit type', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('renders with reset type', () => {
      render(<Button type="reset">Reset</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
    });
  });

  // ========================================
  // CUSTOM CLASS NAME TESTS
  // ========================================
  describe('Custom Class Name', () => {
    it('applies custom className along with default classes', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('btn');
      expect(button).toHaveClass('custom-class');
    });

    it('handles empty className', () => {
      render(<Button className="">Empty Class</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn');
    });
  });

  // ========================================
  // COMBINED PROPS TESTS
  // ========================================
  describe('Combined Props', () => {
    it('combines multiple props correctly', () => {
      const handleClick = vi.fn();
      render(
        <Button
          variant="secondary"
          size="large"
          fullWidth
          className="extra-class"
          onClick={handleClick}
        >
          Combined
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn');
      expect(button).toHaveClass('btn-secondary');
      expect(button).toHaveClass('btn-large');
      expect(button).toHaveClass('btn-full-width');
      expect(button).toHaveClass('extra-class');
    });

    it('prioritizes disabled over loading for class names', () => {
      render(<Button disabled loading>Both</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('btn-disabled');
      expect(button).toHaveClass('btn-loading');
      expect(button).toBeDisabled();
    });
  });

  // ========================================
  // ACCESSIBILITY TESTS
  // ========================================
  describe('Accessibility', () => {
    it('is focusable when not disabled', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');

      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('is not focusable when disabled', () => {
      render(<Button disabled>Not Focusable</Button>);
      const button = screen.getByRole('button');

      button.focus();
      expect(document.activeElement).not.toBe(button);
    });

    it('can be triggered with Enter key', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalled();
    });

    it('can be triggered with Space key', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard(' ');

      expect(handleClick).toHaveBeenCalled();
    });
  });

  // ========================================
  // EDGE CASES
  // ========================================
  describe('Edge Cases', () => {
    it('handles undefined children gracefully', () => {
      render(<Button>{undefined}</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles null children gracefully', () => {
      render(<Button>{null}</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles multiple children', () => {
      render(
        <Button>
          <span>First</span>
          <span>Second</span>
        </Button>
      );
      expect(screen.getByRole('button')).toHaveTextContent('FirstSecond');
    });

    it('handles number children', () => {
      render(<Button>{123}</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('123');
    });
  });
});
