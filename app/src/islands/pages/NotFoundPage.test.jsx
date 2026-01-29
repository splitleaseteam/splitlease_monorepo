import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotFoundPage from './NotFoundPage.jsx';

// Mock the Header and Footer components
vi.mock('../shared/Header.jsx', () => ({
  default: () => <header data-testid="header">Header</header>
}));

vi.mock('../shared/Footer.jsx', () => ({
  default: () => <footer data-testid="footer">Footer</footer>
}));

vi.mock('../shared/Button.jsx', () => ({
  default: ({ children, onClick, variant, size, ...props }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  )
}));

describe('NotFoundPage Component', () => {
  let originalLocation;

  beforeEach(() => {
    // Save original window.location
    originalLocation = window.location;
    delete window.location;
    window.location = { href: '' };
  });

  afterEach(() => {
    // Restore original window.location
    window.location = originalLocation;
    vi.clearAllMocks();
  });

  // ========================================
  // STRUCTURE TESTS
  // ========================================
  describe('Page Structure', () => {
    it('renders the Header component', () => {
      render(<NotFoundPage />);
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('renders the Footer component', () => {
      render(<NotFoundPage />);
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('renders the main content container', () => {
      const { container } = render(<NotFoundPage />);
      expect(container.querySelector('.not-found-container')).toBeInTheDocument();
    });

    it('renders the page container', () => {
      const { container } = render(<NotFoundPage />);
      expect(container.querySelector('.page-container')).toBeInTheDocument();
    });
  });

  // ========================================
  // CONTENT TESTS
  // ========================================
  describe('Content', () => {
    it('displays the 404 title', () => {
      render(<NotFoundPage />);
      expect(screen.getByText('404')).toBeInTheDocument();
    });

    it('displays the "Page Not Found" heading', () => {
      render(<NotFoundPage />);
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    });

    it('displays the descriptive text', () => {
      render(<NotFoundPage />);
      expect(screen.getByText(/The page you're looking for doesn't exist or has been moved/)).toBeInTheDocument();
    });
  });

  // ========================================
  // ACCESSIBILITY TESTS
  // ========================================
  describe('Accessibility', () => {
    it('has proper aria-label on 404 title', () => {
      render(<NotFoundPage />);
      const title = screen.getByText('404');
      expect(title).toHaveAttribute('aria-label', 'Error 404');
    });

    it('has proper heading hierarchy', () => {
      render(<NotFoundPage />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('404');

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent('Page Not Found');
    });

    it('renders navigation section with aria-label', () => {
      render(<NotFoundPage />);
      const nav = screen.getByRole('navigation', { name: 'Additional navigation' });
      expect(nav).toBeInTheDocument();
    });

    it('has aria-label on Go Home button', () => {
      render(<NotFoundPage />);
      expect(screen.getByRole('button', { name: /Return to homepage/i })).toBeInTheDocument();
    });

    it('has aria-label on Search Listings button', () => {
      render(<NotFoundPage />);
      expect(screen.getByRole('button', { name: /Browse available listings/i })).toBeInTheDocument();
    });

    it('has aria-hidden on separators', () => {
      const { container } = render(<NotFoundPage />);
      const separators = container.querySelectorAll('.separator');
      separators.forEach(separator => {
        expect(separator).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  // ========================================
  // BUTTON TESTS
  // ========================================
  describe('Action Buttons', () => {
    it('renders Go Home button with primary variant', () => {
      render(<NotFoundPage />);
      const goHomeButton = screen.getByRole('button', { name: /Return to homepage/i });
      expect(goHomeButton).toHaveAttribute('data-variant', 'primary');
    });

    it('renders Search Listings button with outline variant', () => {
      render(<NotFoundPage />);
      const searchButton = screen.getByRole('button', { name: /Browse available listings/i });
      expect(searchButton).toHaveAttribute('data-variant', 'outline');
    });

    it('renders buttons with large size', () => {
      render(<NotFoundPage />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('data-size', 'large');
      });
    });

    it('navigates to home when Go Home button is clicked', async () => {
      render(<NotFoundPage />);

      await userEvent.click(screen.getByRole('button', { name: /Return to homepage/i }));

      expect(window.location.href).toBe('/');
    });

    it('navigates to search when Search Listings button is clicked', async () => {
      render(<NotFoundPage />);

      await userEvent.click(screen.getByRole('button', { name: /Browse available listings/i }));

      expect(window.location.href).toBe('/search');
    });
  });

  // ========================================
  // NAVIGATION LINKS TESTS
  // ========================================
  describe('Navigation Links', () => {
    it('renders FAQ link', () => {
      render(<NotFoundPage />);
      const faqLink = screen.getByRole('link', { name: 'FAQ' });
      expect(faqLink).toBeInTheDocument();
      expect(faqLink).toHaveAttribute('href', '/faq.html');
    });

    it('renders List With Us link', () => {
      render(<NotFoundPage />);
      const listLink = screen.getByRole('link', { name: 'List With Us' });
      expect(listLink).toBeInTheDocument();
      expect(listLink).toHaveAttribute('href', '/list-with-us.html');
    });

    it('renders Why Split Lease link', () => {
      render(<NotFoundPage />);
      const whyLink = screen.getByRole('link', { name: 'Why Split Lease' });
      expect(whyLink).toBeInTheDocument();
      expect(whyLink).toHaveAttribute('href', '/why-split-lease.html');
    });

    it('renders separator characters between links', () => {
      const { container } = render(<NotFoundPage />);
      const separators = container.querySelectorAll('.separator');
      expect(separators.length).toBe(2);
    });
  });

  // ========================================
  // CSS CLASSES TESTS
  // ========================================
  describe('CSS Classes', () => {
    it('applies not-found-content class', () => {
      const { container } = render(<NotFoundPage />);
      expect(container.querySelector('.not-found-content')).toBeInTheDocument();
    });

    it('applies not-found-title class to 404', () => {
      const { container } = render(<NotFoundPage />);
      expect(container.querySelector('.not-found-title')).toBeInTheDocument();
    });

    it('applies not-found-heading class', () => {
      const { container } = render(<NotFoundPage />);
      expect(container.querySelector('.not-found-heading')).toBeInTheDocument();
    });

    it('applies not-found-text class', () => {
      const { container } = render(<NotFoundPage />);
      expect(container.querySelector('.not-found-text')).toBeInTheDocument();
    });

    it('applies not-found-actions class', () => {
      const { container } = render(<NotFoundPage />);
      expect(container.querySelector('.not-found-actions')).toBeInTheDocument();
    });

    it('applies not-found-links class to nav', () => {
      const { container } = render(<NotFoundPage />);
      expect(container.querySelector('.not-found-links')).toBeInTheDocument();
    });
  });

  // ========================================
  // SEMANTIC HTML TESTS
  // ========================================
  describe('Semantic HTML', () => {
    it('uses main element for content', () => {
      render(<NotFoundPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('uses nav element for links', () => {
      render(<NotFoundPage />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('uses proper heading elements', () => {
      render(<NotFoundPage />);
      expect(screen.getAllByRole('heading').length).toBeGreaterThanOrEqual(2);
    });
  });
});
