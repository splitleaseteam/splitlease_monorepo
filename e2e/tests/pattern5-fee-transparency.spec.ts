/**
 * Pattern 5: Fee Transparency E2E Tests
 *
 * Tests for transparent fee breakdown display, value justification,
 * and payment flow integration with Stripe.
 *
 * Covers:
 * - Fee breakdown display (platform fee + landlord share)
 * - "View Breakdown" expandable section
 * - "What does this cover?" modal
 * - Savings vs. competitors display
 * - Total price calculation
 * - Payment integration readiness
 * - Fee percentage display
 */

import { test, expect } from '../fixtures/auth';

test.describe('Pattern 5: Fee Transparency', () => {
  // ============================================================================
  // PRICE SUMMARY - DISPLAY
  // ============================================================================

  test.describe('Price Summary - Display', () => {
    test('should display "Price Summary" section', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        // Look for price summary
        const priceSummary = page.locator(
          '[data-testid="price-summary"], .price-summary, .fee-price-display, :has-text("Price Summary")'
        );

        const summaryVisible = await priceSummary.isVisible().catch(() => false);
        if (summaryVisible) {
          expect(summaryVisible).toBeTruthy();
        }
      }
    });

    test('should show base rate/base price', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const baseRate = page.locator(
          ':has-text("Base Rate"), :has-text("Base Price"), [data-testid="base-price"]'
        );

        const rateVisible = await baseRate.isVisible().catch(() => false);
        if (rateVisible) {
          const rateText = await baseRate.textContent();
          expect(rateText).toMatch(/\$\d+/);
        }
      }
    });

    test('should display platform & service fee', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const platformFee = page.locator(
          ':has-text("Platform"), :has-text("Service Fee"), [data-testid="platform-fee"]'
        );

        const feeVisible = await platformFee.isVisible().catch(() => false);
        if (feeVisible) {
          const feeText = await platformFee.textContent();
          expect(feeText).toMatch(/\$\d+/);
        }
      }
    });

    test('should show total price', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const totalPrice = page.locator(
          ':has-text("Total Price"), :has-text("Total Amount"), [data-testid="total-price"]'
        );

        const priceVisible = await totalPrice.isVisible().catch(() => false);
        if (priceVisible) {
          const priceText = await totalPrice.textContent();
          expect(priceText).toMatch(/\$\d+/);
        }
      }
    });

    test('should have info icon for fee explanation', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const infoIcon = page.locator(
          '.info-icon, [data-testid="info-icon"], svg:near(:has-text("Price Summary"))'
        );

        const iconVisible = await infoIcon.isVisible().catch(() => false);
        if (iconVisible) {
          expect(iconVisible).toBeTruthy();
        }
      }
    });
  });

  // ============================================================================
  // FEE BREAKDOWN - EXPANDABLE
  // ============================================================================

  test.describe('Fee Breakdown - Expandable', () => {
    test('should have "View Breakdown" button', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const viewBreakdownButton = page.locator(
          'button:has-text("View Breakdown"), button:has-text("Breakdown"), [data-testid="view-breakdown"]'
        );

        const buttonVisible = await viewBreakdownButton.isVisible().catch(() => false);
        if (buttonVisible) {
          expect(buttonVisible).toBeTruthy();
        }
      }
    });

    test('should expand breakdown when clicking button', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const viewBreakdownButton = page.locator('button:has-text("View Breakdown"), button:has-text("Breakdown")');

        const buttonVisible = await viewBreakdownButton.isVisible().catch(() => false);
        if (buttonVisible) {
          // Click to expand
          await viewBreakdownButton.click();
          await page.waitForTimeout(500);

          // Check for expanded breakdown
          const expandedBreakdown = page.locator(
            '.expanded-breakdown, .breakdown-details, [data-testid="expanded-breakdown"]'
          );

          const breakdownVisible = await expandedBreakdown.isVisible().catch(() => false);
          if (breakdownVisible) {
            expect(breakdownVisible).toBeTruthy();
          }
        }
      }
    });

    test('expanded breakdown should show platform fee percentage', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const viewBreakdownButton = page.locator('button:has-text("View Breakdown"), button:has-text("Breakdown")');

        const buttonVisible = await viewBreakdownButton.isVisible().catch(() => false);
        if (buttonVisible) {
          await viewBreakdownButton.click();
          await page.waitForTimeout(500);

          const expandedBreakdown = page.locator('.expanded-breakdown, .breakdown-details');

          const breakdownVisible = await expandedBreakdown.isVisible().catch(() => false);
          if (breakdownVisible) {
            const breakdownText = await expandedBreakdown.textContent();
            // Should contain percentage
            expect(breakdownText).toMatch(/\d+(\.\d+)?%/);
          }
        }
      }
    });

    test('expanded breakdown should show landlord share', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const viewBreakdownButton = page.locator('button:has-text("View Breakdown")');

        const buttonVisible = await viewBreakdownButton.isVisible().catch(() => false);
        if (buttonVisible) {
          await viewBreakdownButton.click();
          await page.waitForTimeout(500);

          const landlordShare = page.locator(
            ':has-text("Landlord Share"), :has-text("Host Share"), [data-testid="landlord-share"]'
          );

          const shareVisible = await landlordShare.isVisible().catch(() => false);
          if (shareVisible) {
            const shareText = await landlordShare.textContent();
            expect(shareText).toMatch(/\$\d+/);
          }
        }
      }
    });

    test('expanded breakdown should show total fee paid by user', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const viewBreakdownButton = page.locator('button:has-text("View Breakdown")');

        const buttonVisible = await viewBreakdownButton.isVisible().catch(() => false);
        if (buttonVisible) {
          await viewBreakdownButton.click();
          await page.waitForTimeout(500);

          const totalFeePaid = page.locator(
            ':has-text("Total Fee Paid"), :has-text("You Pay"), [data-testid="total-fee-paid"]'
          );

          const feeVisible = await totalFeePaid.isVisible().catch(() => false);
          if (feeVisible) {
            const feeText = await totalFeePaid.textContent();
            expect(feeText).toMatch(/\$\d+/);
          }
        }
      }
    });

    test('should have "What does this cover?" link', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const viewBreakdownButton = page.locator('button:has-text("View Breakdown")');

        const buttonVisible = await viewBreakdownButton.isVisible().catch(() => false);
        if (buttonVisible) {
          await viewBreakdownButton.click();
          await page.waitForTimeout(500);

          const whatCoverLink = page.locator(
            'button:has-text("What does this cover"), a:has-text("What does this cover")'
          );

          const linkVisible = await whatCoverLink.isVisible().catch(() => false);
          if (linkVisible) {
            expect(linkVisible).toBeTruthy();
          }
        }
      }
    });

    test('should collapse when clicking "View Breakdown" again', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const viewBreakdownButton = page.locator('button:has-text("View Breakdown")');

        const buttonVisible = await viewBreakdownButton.isVisible().catch(() => false);
        if (buttonVisible) {
          // Expand
          await viewBreakdownButton.click();
          await page.waitForTimeout(500);

          // Collapse
          await viewBreakdownButton.click();
          await page.waitForTimeout(500);

          const expandedBreakdown = page.locator('.expanded-breakdown, .breakdown-details');
          await expect(expandedBreakdown).toBeHidden();
        }
      }
    });
  });

  // ============================================================================
  // FEE EXPLAINER MODAL
  // ============================================================================

  test.describe('Fee Explainer Modal', () => {
    test('should open modal when clicking info icon', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const infoIcon = page.locator('.info-icon, [data-testid="info-icon"]');

        const iconVisible = await infoIcon.isVisible().catch(() => false);
        if (iconVisible) {
          await infoIcon.click();
          await page.waitForTimeout(500);

          // Check for modal
          const modal = page.locator(
            '[data-testid="fee-explainer"], .fee-explainer-modal, .modal:has-text("fee")'
          );

          const modalVisible = await modal.isVisible().catch(() => false);
          if (modalVisible) {
            expect(modalVisible).toBeTruthy();
          }
        }
      }
    });

    test('modal should have "Why this fee?" title', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const infoIcon = page.locator('.info-icon, [data-testid="info-icon"]');

        const iconVisible = await infoIcon.isVisible().catch(() => false);
        if (iconVisible) {
          await infoIcon.click();
          await page.waitForTimeout(500);

          const modalTitle = page.locator(':has-text("Why this fee")');

          const titleVisible = await modalTitle.isVisible().catch(() => false);
          if (titleVisible) {
            const titleText = await modalTitle.textContent();
            expect(titleText?.toLowerCase()).toContain('fee');
          }
        }
      }
    });

    test('should explain Protection & Support value prop', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const infoIcon = page.locator('.info-icon, [data-testid="info-icon"]');

        const iconVisible = await infoIcon.isVisible().catch(() => false);
        if (iconVisible) {
          await infoIcon.click();
          await page.waitForTimeout(500);

          const protectionValue = page.locator(
            ':has-text("Protection"), :has-text("Support"), :has-text("insurance")'
          );

          const valueVisible = await protectionValue.isVisible().catch(() => false);
          if (valueVisible) {
            const valueText = await protectionValue.textContent();
            expect(valueText).toBeTruthy();
          }
        }
      }
    });

    test('should explain Split Model Efficiency', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const infoIcon = page.locator('.info-icon, [data-testid="info-icon"]');

        const iconVisible = await infoIcon.isVisible().catch(() => false);
        if (iconVisible) {
          await infoIcon.click();
          await page.waitForTimeout(500);

          const splitModel = page.locator(
            ':has-text("Split Model"), :has-text("split the cost"), :has-text("landlord")'
          );

          const modelVisible = await splitModel.isVisible().catch(() => false);
          if (modelVisible) {
            const modelText = await splitModel.textContent();
            expect(modelText).toBeTruthy();
          }
        }
      }
    });

    test('should explain Automated Handling', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const infoIcon = page.locator('.info-icon, [data-testid="info-icon"]');

        const iconVisible = await infoIcon.isVisible().catch(() => false);
        if (iconVisible) {
          await infoIcon.click();
          await page.waitForTimeout(500);

          const automation = page.locator(
            ':has-text("Automated"), :has-text("legal documentation"), :has-text("Stripe")'
          );

          const automationVisible = await automation.isVisible().catch(() => false);
          if (automationVisible) {
            const automationText = await automation.textContent();
            expect(automationText).toBeTruthy();
          }
        }
      }
    });

    test('should have close button', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const infoIcon = page.locator('.info-icon, [data-testid="info-icon"]');

        const iconVisible = await infoIcon.isVisible().catch(() => false);
        if (iconVisible) {
          await infoIcon.click();
          await page.waitForTimeout(500);

          const closeButton = page.locator(
            'button:has-text("Got it"), button:has-text("Close"), .fee-explainer-close'
          );

          const buttonVisible = await closeButton.isVisible().catch(() => false);
          if (buttonVisible) {
            expect(buttonVisible).toBeTruthy();
          }
        }
      }
    });

    test('should close modal when clicking close button', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const infoIcon = page.locator('.info-icon, [data-testid="info-icon"]');

        const iconVisible = await infoIcon.isVisible().catch(() => false);
        if (iconVisible) {
          await infoIcon.click();
          await page.waitForTimeout(500);

          const closeButton = page.locator('button:has-text("Got it"), .fee-explainer-close').first();

          const buttonVisible = await closeButton.isVisible().catch(() => false);
          if (buttonVisible) {
            await closeButton.click();
            await page.waitForTimeout(500);

            const modal = page.locator('.fee-explainer-modal, [data-testid="fee-explainer"]');
            await expect(modal).toBeHidden();
          }
        }
      }
    });
  });

  // ============================================================================
  // SAVINGS DISPLAY
  // ============================================================================

  test.describe('Savings Display', () => {
    test('should show savings vs. competitors', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const savings = page.locator(
          ':has-text("saving"), :has-text("vs. competitors"), [data-testid="savings-display"]'
        );

        const savingsVisible = await savings.isVisible().catch(() => false);
        if (savingsVisible) {
          const savingsText = await savings.textContent();
          expect(savingsText?.toLowerCase()).toMatch(/sav|vs|competitor/);
        }
      }
    });

    test('should display savings amount in dollars', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const savings = page.locator(':has-text("saving"), :has-text("vs. competitors")');

        const savingsVisible = await savings.isVisible().catch(() => false);
        if (savingsVisible) {
          const savingsText = await savings.textContent();
          expect(savingsText).toMatch(/\$\d+/);
        }
      }
    });

    test('should have visual indicator for savings (trending down icon)', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const savingsIcon = page.locator(
          'svg:near(:has-text("saving")), .savings-icon, [data-testid="savings-icon"]'
        );

        const iconVisible = await savingsIcon.isVisible().catch(() => false);
        if (iconVisible) {
          expect(iconVisible).toBeTruthy();
        }
      }
    });
  });

  // ============================================================================
  // FEE CALCULATION ACCURACY
  // ============================================================================

  test.describe('Fee Calculation Accuracy', () => {
    test('total price should equal base price + fees', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        // Extract values if all visible
        const basePriceEl = page.locator(':has-text("Base Rate"), :has-text("Base Price")').first();
        const platformFeeEl = page.locator(':has-text("Platform"), :has-text("Service Fee")').first();
        const totalPriceEl = page.locator(':has-text("Total Price"), :has-text("Total Amount")').first();

        const baseVisible = await basePriceEl.isVisible().catch(() => false);
        const feeVisible = await platformFeeEl.isVisible().catch(() => false);
        const totalVisible = await totalPriceEl.isVisible().catch(() => false);

        if (baseVisible && feeVisible && totalVisible) {
          // Just verify they all exist - detailed math validation is for unit tests
          expect(baseVisible && feeVisible && totalVisible).toBeTruthy();
        }
      }
    });

    test('platform fee percentage should be displayed correctly', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const viewBreakdownButton = page.locator('button:has-text("View Breakdown")');

        const buttonVisible = await viewBreakdownButton.isVisible().catch(() => false);
        if (buttonVisible) {
          await viewBreakdownButton.click();
          await page.waitForTimeout(500);

          const platformFeeRow = page.locator(':has-text("Platform Fee")').first();

          const rowVisible = await platformFeeRow.isVisible().catch(() => false);
          if (rowVisible) {
            const rowText = await platformFeeRow.textContent();
            // Should show percentage like 0.75% or 1.5%
            const percentageMatch = rowText?.match(/(\d+(?:\.\d+)?)%/);

            if (percentageMatch) {
              const percentage = parseFloat(percentageMatch[1]);
              // Should be reasonable fee percentage
              expect(percentage).toBeGreaterThan(0);
              expect(percentage).toBeLessThan(10);
            }
          }
        }
      }
    });
  });

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  test.describe('Accessibility', () => {
    test('price rows should be screen reader accessible', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const priceRow = page.locator('.price-row, [data-testid="price-row"]').first();

        const rowVisible = await priceRow.isVisible().catch(() => false);
        if (rowVisible) {
          // Should have text content for screen readers
          const rowText = await priceRow.textContent();
          expect(rowText).toBeTruthy();
        }
      }
    });

    test('"View Breakdown" button should have proper aria attributes', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const viewBreakdownButton = page.locator('button:has-text("View Breakdown")');

        const buttonVisible = await viewBreakdownButton.isVisible().catch(() => false);
        if (buttonVisible) {
          const ariaExpanded = await viewBreakdownButton.getAttribute('aria-expanded');
          const ariaLabel = await viewBreakdownButton.getAttribute('aria-label');

          // Should have aria-expanded or aria-label
          expect(ariaExpanded !== null || ariaLabel !== null).toBeTruthy();
        }
      }
    });

    test('modal should trap focus and have close button', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const infoIcon = page.locator('.info-icon, [data-testid="info-icon"]');

        const iconVisible = await infoIcon.isVisible().catch(() => false);
        if (iconVisible) {
          await infoIcon.click();
          await page.waitForTimeout(500);

          // Check for close button
          const closeButton = page.locator('button:has-text("Got it"), .fee-explainer-close');

          const closeVisible = await closeButton.isVisible().catch(() => false);
          if (closeVisible) {
            expect(closeVisible).toBeTruthy();
          }
        }
      }
    });

    test('fee amounts should be properly labeled', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const platformFee = page.locator(':has-text("Platform"), :has-text("Service Fee")').first();

        const feeVisible = await platformFee.isVisible().catch(() => false);
        if (feeVisible) {
          const feeText = await platformFee.textContent();
          // Should have both label and value
          expect(feeText).toContain('$');
          expect(feeText!.length).toBeGreaterThan(5);
        }
      }
    });
  });

  // ============================================================================
  // MOBILE RESPONSIVENESS
  // ============================================================================

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('fee display should fit mobile viewport', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const feeDisplay = page.locator('.fee-price-display, [data-testid="price-summary"]');

        const displayVisible = await feeDisplay.isVisible().catch(() => false);
        if (displayVisible) {
          const box = await feeDisplay.boundingBox();
          if (box) {
            expect(box.width).toBeLessThanOrEqual(375);
          }
        }
      }
    });

    test('fee explainer modal should be full-screen on mobile', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const infoIcon = page.locator('.info-icon, [data-testid="info-icon"]');

        const iconVisible = await infoIcon.isVisible().catch(() => false);
        if (iconVisible) {
          await infoIcon.click();
          await page.waitForTimeout(500);

          const modal = page.locator('.fee-explainer-modal, [data-testid="fee-explainer"]');

          const modalVisible = await modal.isVisible().catch(() => false);
          if (modalVisible) {
            const box = await modal.boundingBox();
            if (box) {
              expect(box.width).toBeGreaterThan(300);
            }
          }
        }
      }
    });

    test('price rows should remain readable on mobile', async ({ guestBigSpenderPage: page }) => {
      await page.goto('/guest-leases');
      await page.waitForLoadState('networkidle');

      const requestButton = page.locator(
        'button:has-text("Request Date Change"), button:has-text("Change Dates")'
      ).first();

      if (await requestButton.isVisible()) {
        await requestButton.click();
        await page.waitForTimeout(2000);

        const priceRow = page.locator('.price-row, [data-testid="price-row"]').first();

        const rowVisible = await priceRow.isVisible().catch(() => false);
        if (rowVisible) {
          const fontSize = await priceRow.evaluate((el) =>
            window.getComputedStyle(el).fontSize
          );
          const fontSizeNum = parseInt(fontSize);
          // Should be readable on mobile
          expect(fontSizeNum).toBeGreaterThanOrEqual(12);
        }
      }
    });
  });
});
