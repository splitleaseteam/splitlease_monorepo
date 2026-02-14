import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorModal } from './ErrorModal.jsx';

describe('ErrorModal Component', () => {
  const defaultProps = {
    errorInfo: {
      hasError: true,
      errorType: 'minimum_nights',
      errorMessage: 'Please select at least 2 nights.'
    },
    onClose: vi.fn()
  };

  // ========================================
  // RENDERING TESTS
  // ========================================
  describe('Rendering', () => {
    it('renders nothing when hasError is false', () => {
      const { container } = render(
        <ErrorModal
          errorInfo={{ hasError: false, errorType: '', errorMessage: '' }}
          onClose={vi.fn()}
        />
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('renders overlay when hasError is true', () => {
      render(<ErrorModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'I Understand' })).toBeInTheDocument();
    });

    it('renders error message', () => {
      render(<ErrorModal {...defaultProps} />);
      expect(screen.getByText('Please select at least 2 nights.')).toBeInTheDocument();
    });

    it('renders backdrop element', () => {
      const { container } = render(<ErrorModal {...defaultProps} />);
      expect(container.querySelector('.error-overlay-backdrop')).toBeInTheDocument();
    });

    it('renders overlay container', () => {
      const { container } = render(<ErrorModal {...defaultProps} />);
      expect(container.querySelector('.error-overlay')).toBeInTheDocument();
    });
  });

  // ========================================
  // ERROR TYPE TITLE TESTS
  // ========================================
  describe('Error Titles by Type', () => {
    const errorTypes = [
      { type: 'minimum_nights', expectedTitle: 'Minimum Days Required' },
      { type: 'maximum_nights', expectedTitle: 'Maximum Days Exceeded' },
      { type: 'maximum_nights_warning', expectedTitle: 'Host Preference Notice' },
      { type: 'contiguity', expectedTitle: 'Days Not Consecutive' },
      { type: 'availability', expectedTitle: 'Day Not Available' },
      { type: 'days_selected', expectedTitle: 'Invalid Selection' },
      { type: 'nights_outside_host', expectedTitle: 'Outside Host Availability' },
      { type: 'unknown_type', expectedTitle: 'Error' },
      { type: '', expectedTitle: 'Error' }
    ];

    errorTypes.forEach(({ type, expectedTitle }) => {
      it(`renders correct title for error type: ${type || 'empty'}`, () => {
        render(
          <ErrorModal
            errorInfo={{
              hasError: true,
              errorType: type,
              errorMessage: 'Test error message'
            }}
            onClose={vi.fn()}
          />
        );
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(expectedTitle);
      });
    });
  });

  // ========================================
  // ADDITIONAL MESSAGE TESTS
  // ========================================
  describe('Additional Messages', () => {
    it('shows additional message for maximum_nights_warning', () => {
      render(
        <ErrorModal
          errorInfo={{
            hasError: true,
            errorType: 'maximum_nights_warning',
            errorMessage: 'You have exceeded the preferred maximum.'
          }}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText(/You can continue selecting more days/)).toBeInTheDocument();
      // The actual message uses "reduce" not "reducing"
      expect(screen.getByText(/reduce the likelihood of your reservation being approved/)).toBeInTheDocument();
    });

    it('does not show additional message for other error types', () => {
      render(
        <ErrorModal
          errorInfo={{
            hasError: true,
            errorType: 'minimum_nights',
            errorMessage: 'Please select at least 2 nights.'
          }}
          onClose={vi.fn()}
        />
      );

      expect(screen.queryByText(/You can continue selecting more days/)).not.toBeInTheDocument();
    });
  });

  // ========================================
  // CLOSE HANDLER TESTS
  // ========================================
  describe('Close Handler', () => {
    it('calls onClose when button is clicked', async () => {
      const handleClose = vi.fn();
      render(
        <ErrorModal
          {...defaultProps}
          onClose={handleClose}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: 'I Understand' }));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking inside overlay', () => {
      const handleClose = vi.fn();
      const { container } = render(
        <ErrorModal
          {...defaultProps}
          onClose={handleClose}
        />
      );

      const overlay = container.querySelector('.error-overlay');
      fireEvent.click(overlay);

      // onClose should not be called because stopPropagation is used
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // CSS CLASSES TESTS
  // ========================================
  describe('CSS Classes', () => {
    it('applies error-overlay-backdrop class', () => {
      const { container } = render(<ErrorModal {...defaultProps} />);
      expect(container.querySelector('.error-overlay-backdrop')).toBeInTheDocument();
    });

    it('applies error-overlay class to content container', () => {
      const { container } = render(<ErrorModal {...defaultProps} />);
      expect(container.querySelector('.error-overlay')).toBeInTheDocument();
    });

    it('applies error-header class', () => {
      const { container } = render(<ErrorModal {...defaultProps} />);
      expect(container.querySelector('.error-header')).toBeInTheDocument();
    });

    it('applies error-content class', () => {
      const { container } = render(<ErrorModal {...defaultProps} />);
      expect(container.querySelector('.error-content')).toBeInTheDocument();
    });

    it('applies error-actions class', () => {
      const { container } = render(<ErrorModal {...defaultProps} />);
      expect(container.querySelector('.error-actions')).toBeInTheDocument();
    });

    it('applies error-button class to close button', () => {
      const { container } = render(<ErrorModal {...defaultProps} />);
      expect(container.querySelector('.error-button')).toBeInTheDocument();
    });

    it('applies error-additional-info class for warning message', () => {
      const { container } = render(
        <ErrorModal
          errorInfo={{
            hasError: true,
            errorType: 'maximum_nights_warning',
            errorMessage: 'Test message'
          }}
          onClose={vi.fn()}
        />
      );
      expect(container.querySelector('.error-additional-info')).toBeInTheDocument();
    });
  });

  // ========================================
  // STRUCTURE TESTS
  // ========================================
  describe('Structure', () => {
    it('has correct heading hierarchy', () => {
      render(<ErrorModal {...defaultProps} />);
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('renders message in paragraph element', () => {
      render(<ErrorModal {...defaultProps} />);
      const paragraphs = screen.getAllByText(/Please select at least 2 nights./);
      expect(paragraphs.length).toBeGreaterThan(0);
    });

    it('renders button with correct text', () => {
      render(<ErrorModal {...defaultProps} />);
      expect(screen.getByRole('button')).toHaveTextContent('I Understand');
    });
  });

  // ========================================
  // DIFFERENT ERROR MESSAGES TESTS
  // ========================================
  describe('Different Error Messages', () => {
    const messages = [
      'Please select at least 2 nights.',
      'You have exceeded the maximum of 7 nights.',
      'Selected days must be consecutive.',
      'This day is not available for booking.',
      'Please select valid days.',
      'The selected nights are outside the host availability window.'
    ];

    messages.forEach((message) => {
      it(`displays error message: "${message}"`, () => {
        render(
          <ErrorModal
            errorInfo={{
              hasError: true,
              errorType: 'minimum_nights',
              errorMessage: message
            }}
            onClose={vi.fn()}
          />
        );

        expect(screen.getByText(message)).toBeInTheDocument();
      });
    });
  });

  // ========================================
  // EDGE CASES
  // ========================================
  describe('Edge Cases', () => {
    it('handles empty error message', () => {
      render(
        <ErrorModal
          errorInfo={{
            hasError: true,
            errorType: 'minimum_nights',
            errorMessage: ''
          }}
          onClose={vi.fn()}
        />
      );

      // Should still render the overlay structure
      expect(screen.getByRole('button', { name: 'I Understand' })).toBeInTheDocument();
    });

    it('handles undefined errorType gracefully', () => {
      render(
        <ErrorModal
          errorInfo={{
            hasError: true,
            errorType: undefined,
            errorMessage: 'Test message'
          }}
          onClose={vi.fn()}
        />
      );

      // Should fall back to default 'Error' title
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Error');
    });

    it('handles null errorType gracefully', () => {
      render(
        <ErrorModal
          errorInfo={{
            hasError: true,
            errorType: null,
            errorMessage: 'Test message'
          }}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Error');
    });

    it('handles very long error messages', () => {
      const longMessage = 'A'.repeat(500);
      render(
        <ErrorModal
          errorInfo={{
            hasError: true,
            errorType: 'minimum_nights',
            errorMessage: longMessage
          }}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('handles special characters in error message', () => {
      const specialMessage = 'Error: <script>alert("XSS")</script> & special "chars"';
      render(
        <ErrorModal
          errorInfo={{
            hasError: true,
            errorType: 'minimum_nights',
            errorMessage: specialMessage
          }}
          onClose={vi.fn()}
        />
      );

      // React escapes HTML by default
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });
  });

  // ========================================
  // INTERACTION TESTS
  // ========================================
  describe('Interactions', () => {
    it('prevents event propagation when clicking overlay content', () => {
      const handleClose = vi.fn();
      const { container } = render(
        <ErrorModal
          {...defaultProps}
          onClose={handleClose}
        />
      );

      const overlay = container.querySelector('.error-overlay');
      fireEvent.click(overlay);

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('button can be focused', () => {
      render(<ErrorModal {...defaultProps} />);
      const button = screen.getByRole('button');

      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('button can be activated with keyboard', async () => {
      const handleClose = vi.fn();
      render(
        <ErrorModal
          {...defaultProps}
          onClose={handleClose}
        />
      );

      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard('{Enter}');

      expect(handleClose).toHaveBeenCalled();
    });

    it('button can be activated with space key', async () => {
      const handleClose = vi.fn();
      render(
        <ErrorModal
          {...defaultProps}
          onClose={handleClose}
        />
      );

      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard(' ');

      expect(handleClose).toHaveBeenCalled();
    });
  });

  // ========================================
  // ALL ERROR TYPES COMPREHENSIVE
  // ========================================
  describe('All Error Types - Full Rendering', () => {
    it('renders minimum_nights error correctly', () => {
      render(
        <ErrorModal
          errorInfo={{
            hasError: true,
            errorType: 'minimum_nights',
            errorMessage: 'Minimum 3 nights required for this listing.'
          }}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Minimum Days Required')).toBeInTheDocument();
      expect(screen.getByText('Minimum 3 nights required for this listing.')).toBeInTheDocument();
    });

    it('renders maximum_nights error correctly', () => {
      render(
        <ErrorModal
          errorInfo={{
            hasError: true,
            errorType: 'maximum_nights',
            errorMessage: 'Maximum 14 nights allowed.'
          }}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Maximum Days Exceeded')).toBeInTheDocument();
      expect(screen.getByText('Maximum 14 nights allowed.')).toBeInTheDocument();
    });

    it('renders contiguity error correctly', () => {
      render(
        <ErrorModal
          errorInfo={{
            hasError: true,
            errorType: 'contiguity',
            errorMessage: 'Days must be consecutive. Please deselect non-adjacent days.'
          }}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Days Not Consecutive')).toBeInTheDocument();
      expect(screen.getByText('Days must be consecutive. Please deselect non-adjacent days.')).toBeInTheDocument();
    });

    it('renders availability error correctly', () => {
      render(
        <ErrorModal
          errorInfo={{
            hasError: true,
            errorType: 'availability',
            errorMessage: 'Tuesday is not available for this listing.'
          }}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Day Not Available')).toBeInTheDocument();
      expect(screen.getByText('Tuesday is not available for this listing.')).toBeInTheDocument();
    });
  });
});
