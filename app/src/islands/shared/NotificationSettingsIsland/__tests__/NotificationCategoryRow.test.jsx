/**
 * Tests for NotificationCategoryRow
 *
 * Tests the category row component that displays a single notification
 * category with SMS and Email toggle options.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationCategoryRow from '../NotificationCategoryRow.jsx';

describe('NotificationCategoryRow', () => {
  // Sample category data for testing
  const mockCategory = {
    id: 'message_forwarding',
    label: 'Message Forwarding',
    description: 'Receive forwarded messages via your preferred channel',
    dbColumn: 'Message Forwarding',
  };

  // Default props for most tests
  const defaultProps = {
    category: mockCategory,
    smsEnabled: false,
    emailEnabled: false,
    onToggleSms: vi.fn(),
    onToggleEmail: vi.fn(),
    smsPending: false,
    emailPending: false,
    isLast: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Rendering Tests
  // ============================================================================
  describe('rendering', () => {
    it('should display category label', () => {
      render(<NotificationCategoryRow {...defaultProps} />);
      expect(screen.getByText('Message Forwarding')).toBeInTheDocument();
    });

    it('should display category description', () => {
      render(<NotificationCategoryRow {...defaultProps} />);
      expect(
        screen.getByText('Receive forwarded messages via your preferred channel')
      ).toBeInTheDocument();
    });

    it('should render SMS toggle', () => {
      render(<NotificationCategoryRow {...defaultProps} />);
      const smsToggle = screen.getByRole('checkbox', {
        name: /SMS notifications/i,
      });
      expect(smsToggle).toBeInTheDocument();
    });

    it('should render Email toggle', () => {
      render(<NotificationCategoryRow {...defaultProps} />);
      const emailToggle = screen.getByRole('checkbox', {
        name: /Email notifications/i,
      });
      expect(emailToggle).toBeInTheDocument();
    });

    it('should show correct enabled states - both disabled', () => {
      render(
        <NotificationCategoryRow
          {...defaultProps}
          smsEnabled={false}
          emailEnabled={false}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it('should show correct enabled states - both enabled', () => {
      render(
        <NotificationCategoryRow
          {...defaultProps}
          smsEnabled={true}
          emailEnabled={true}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });

    it('should show correct enabled states - SMS only', () => {
      render(
        <NotificationCategoryRow
          {...defaultProps}
          smsEnabled={true}
          emailEnabled={false}
        />
      );

      const smsToggle = screen.getByRole('checkbox', {
        name: /SMS notifications/i,
      });
      const emailToggle = screen.getByRole('checkbox', {
        name: /Email notifications/i,
      });

      expect(smsToggle).toBeChecked();
      expect(emailToggle).not.toBeChecked();
    });

    it('should show correct enabled states - Email only', () => {
      render(
        <NotificationCategoryRow
          {...defaultProps}
          smsEnabled={false}
          emailEnabled={true}
        />
      );

      const smsToggle = screen.getByRole('checkbox', {
        name: /SMS notifications/i,
      });
      const emailToggle = screen.getByRole('checkbox', {
        name: /Email notifications/i,
      });

      expect(smsToggle).not.toBeChecked();
      expect(emailToggle).toBeChecked();
    });

    it('should render with row class', () => {
      const { container } = render(<NotificationCategoryRow {...defaultProps} />);
      const row = container.querySelector('.notification-category-row');
      expect(row).toBeInTheDocument();
    });

    it('should apply last row class when isLast is true', () => {
      const { container } = render(
        <NotificationCategoryRow {...defaultProps} isLast={true} />
      );
      const row = container.querySelector('.notification-category-row');
      expect(row).toHaveClass('notification-category-row--last');
    });

    it('should not apply last row class when isLast is false', () => {
      const { container } = render(
        <NotificationCategoryRow {...defaultProps} isLast={false} />
      );
      const row = container.querySelector('.notification-category-row');
      expect(row).not.toHaveClass('notification-category-row--last');
    });
  });

  // ============================================================================
  // Interaction Tests
  // ============================================================================
  describe('interactions', () => {
    it('should call onToggleSms when SMS toggle clicked', async () => {
      const onToggleSms = vi.fn();
      render(
        <NotificationCategoryRow {...defaultProps} onToggleSms={onToggleSms} />
      );

      const smsToggle = screen.getByRole('checkbox', {
        name: /SMS notifications/i,
      });
      await userEvent.click(smsToggle);

      expect(onToggleSms).toHaveBeenCalledTimes(1);
    });

    it('should call onToggleEmail when Email toggle clicked', async () => {
      const onToggleEmail = vi.fn();
      render(
        <NotificationCategoryRow {...defaultProps} onToggleEmail={onToggleEmail} />
      );

      const emailToggle = screen.getByRole('checkbox', {
        name: /Email notifications/i,
      });
      await userEvent.click(emailToggle);

      expect(onToggleEmail).toHaveBeenCalledTimes(1);
    });

    it('should pass pending states to toggles - SMS pending', async () => {
      const onToggleSms = vi.fn();
      render(
        <NotificationCategoryRow
          {...defaultProps}
          smsPending={true}
          onToggleSms={onToggleSms}
        />
      );

      const smsToggle = screen.getByRole('checkbox', {
        name: /SMS notifications/i,
      });

      // Pending toggle should be disabled
      expect(smsToggle).toBeDisabled();

      // Click should not trigger callback
      await userEvent.click(smsToggle);
      expect(onToggleSms).not.toHaveBeenCalled();
    });

    it('should pass pending states to toggles - Email pending', async () => {
      const onToggleEmail = vi.fn();
      render(
        <NotificationCategoryRow
          {...defaultProps}
          emailPending={true}
          onToggleEmail={onToggleEmail}
        />
      );

      const emailToggle = screen.getByRole('checkbox', {
        name: /Email notifications/i,
      });

      // Pending toggle should be disabled
      expect(emailToggle).toBeDisabled();

      // Click should not trigger callback
      await userEvent.click(emailToggle);
      expect(onToggleEmail).not.toHaveBeenCalled();
    });

    it('should allow SMS toggle when only Email is pending', async () => {
      const onToggleSms = vi.fn();
      render(
        <NotificationCategoryRow
          {...defaultProps}
          smsPending={false}
          emailPending={true}
          onToggleSms={onToggleSms}
        />
      );

      const smsToggle = screen.getByRole('checkbox', {
        name: /SMS notifications/i,
      });

      expect(smsToggle).not.toBeDisabled();
      await userEvent.click(smsToggle);
      expect(onToggleSms).toHaveBeenCalledTimes(1);
    });

    it('should allow Email toggle when only SMS is pending', async () => {
      const onToggleEmail = vi.fn();
      render(
        <NotificationCategoryRow
          {...defaultProps}
          smsPending={true}
          emailPending={false}
          onToggleEmail={onToggleEmail}
        />
      );

      const emailToggle = screen.getByRole('checkbox', {
        name: /Email notifications/i,
      });

      expect(emailToggle).not.toBeDisabled();
      await userEvent.click(emailToggle);
      expect(onToggleEmail).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // Layout Tests
  // ============================================================================
  describe('layout', () => {
    it('should position label section on left', () => {
      const { container } = render(<NotificationCategoryRow {...defaultProps} />);
      const labelSection = container.querySelector(
        '.notification-category-label-section'
      );
      expect(labelSection).toBeInTheDocument();
    });

    it('should position toggle section on right', () => {
      const { container } = render(<NotificationCategoryRow {...defaultProps} />);
      const toggleSection = container.querySelector('.notification-toggle-section');
      expect(toggleSection).toBeInTheDocument();
    });

    it('should have label and description elements', () => {
      const { container } = render(<NotificationCategoryRow {...defaultProps} />);

      const label = container.querySelector('.notification-category-label');
      const description = container.querySelector(
        '.notification-category-description'
      );

      expect(label).toBeInTheDocument();
      expect(description).toBeInTheDocument();
    });

    it('should have toggle wrappers for each toggle', () => {
      const { container } = render(<NotificationCategoryRow {...defaultProps} />);
      const wrappers = container.querySelectorAll('.notification-toggle-wrapper');
      expect(wrappers).toHaveLength(2);
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================
  describe('accessibility', () => {
    it('should have accessible SMS toggle with category name', () => {
      render(<NotificationCategoryRow {...defaultProps} />);
      const smsToggle = screen.getByRole('checkbox', {
        name: 'Message Forwarding SMS notifications',
      });
      expect(smsToggle).toBeInTheDocument();
    });

    it('should have accessible Email toggle with category name', () => {
      render(<NotificationCategoryRow {...defaultProps} />);
      const emailToggle = screen.getByRole('checkbox', {
        name: 'Message Forwarding Email notifications',
      });
      expect(emailToggle).toBeInTheDocument();
    });

    it('should have two switch elements for accessibility', () => {
      render(<NotificationCategoryRow {...defaultProps} />);
      const switches = screen.getAllByRole('switch');
      expect(switches).toHaveLength(2);
    });
  });

  // ============================================================================
  // Different Categories Tests
  // ============================================================================
  describe('different categories', () => {
    it('should render payment reminders category correctly', () => {
      const paymentCategory = {
        id: 'payment_reminders',
        label: 'Payment Reminders',
        description: 'Billing and payment notifications',
        dbColumn: 'Payment Reminders',
      };

      render(<NotificationCategoryRow {...defaultProps} category={paymentCategory} />);

      expect(screen.getByText('Payment Reminders')).toBeInTheDocument();
      expect(
        screen.getByText('Billing and payment notifications')
      ).toBeInTheDocument();
    });

    it('should render promotional category correctly', () => {
      const promotionalCategory = {
        id: 'promotional',
        label: 'Promotional',
        description: 'Marketing and promotional content',
        dbColumn: 'Promotional',
      };

      render(
        <NotificationCategoryRow {...defaultProps} category={promotionalCategory} />
      );

      expect(screen.getByText('Promotional')).toBeInTheDocument();
      expect(
        screen.getByText('Marketing and promotional content')
      ).toBeInTheDocument();
    });

    it('should render virtual meetings category correctly', () => {
      const virtualMeetingsCategory = {
        id: 'virtual_meetings',
        label: 'Virtual Meetings',
        description: 'Video and online meeting notifications',
        dbColumn: 'Virtual Meetings',
      };

      render(
        <NotificationCategoryRow
          {...defaultProps}
          category={virtualMeetingsCategory}
        />
      );

      expect(screen.getByText('Virtual Meetings')).toBeInTheDocument();
      expect(
        screen.getByText('Video and online meeting notifications')
      ).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle undefined pending states', () => {
      const { container } = render(
        <NotificationCategoryRow
          category={mockCategory}
          smsEnabled={false}
          emailEnabled={false}
          onToggleSms={vi.fn()}
          onToggleEmail={vi.fn()}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeDisabled();
      });
    });

    it('should handle both pending states being true', () => {
      render(
        <NotificationCategoryRow
          {...defaultProps}
          smsPending={true}
          emailPending={true}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeDisabled();
      });
    });

    it('should handle category with long label', () => {
      const longLabelCategory = {
        id: 'long_label',
        label: 'This is a very long category label that might wrap to multiple lines',
        description: 'Description text',
        dbColumn: 'Long Label',
      };

      render(<NotificationCategoryRow {...defaultProps} category={longLabelCategory} />);
      expect(
        screen.getByText(
          'This is a very long category label that might wrap to multiple lines'
        )
      ).toBeInTheDocument();
    });

    it('should handle category with long description', () => {
      const longDescCategory = {
        id: 'long_desc',
        label: 'Short Label',
        description:
          'This is a very long description that explains in great detail what this notification category is for and when you might receive these notifications',
        dbColumn: 'Long Desc',
      };

      render(<NotificationCategoryRow {...defaultProps} category={longDescCategory} />);
      expect(
        screen.getByText(
          'This is a very long description that explains in great detail what this notification category is for and when you might receive these notifications'
        )
      ).toBeInTheDocument();
    });

    it('should handle rapid toggle clicks', async () => {
      const onToggleSms = vi.fn();
      const onToggleEmail = vi.fn();

      render(
        <NotificationCategoryRow
          {...defaultProps}
          onToggleSms={onToggleSms}
          onToggleEmail={onToggleEmail}
        />
      );

      const smsToggle = screen.getByRole('checkbox', {
        name: /SMS notifications/i,
      });
      const emailToggle = screen.getByRole('checkbox', {
        name: /Email notifications/i,
      });

      await userEvent.click(smsToggle);
      await userEvent.click(emailToggle);
      await userEvent.click(smsToggle);

      expect(onToggleSms).toHaveBeenCalledTimes(2);
      expect(onToggleEmail).toHaveBeenCalledTimes(1);
    });
  });
});
