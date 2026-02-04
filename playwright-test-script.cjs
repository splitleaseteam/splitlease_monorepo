const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Step 1: Navigating to listing page...');
  // The route format is /view-split-lease/:id (path param, not query param)
  await page.goto('http://localhost:3000/view-split-lease/1770159292555x84785333838911712');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  console.log('Step 2: Taking initial screenshot...');
  await page.screenshot({ path: 'listing-page-screenshot.png', fullPage: true });
  console.log('Screenshot saved to listing-page-screenshot.png');

  // Check page content
  const pageTitle = await page.title();
  console.log('Page title:', pageTitle);

  // Check for sign in button and create proposal button
  const signInButton = await page.$('text=Sign In');
  let createProposalButton = await page.$('button:has-text("Create Proposal")');

  console.log('\nPage elements found:');
  console.log('- Sign In button:', !!signInButton);
  console.log('- Create Proposal button:', !!createProposalButton);

  // If sign in is needed, login first
  if (signInButton) {
    console.log('\nStep 3: Login required, clicking sign in...');
    await signInButton.click();

    // Wait for login modal to appear
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

    // Fill login form
    console.log('Filling login credentials...');
    await page.fill('input[type="email"], input[name="email"]', 'splitleasefrederick+frederickros@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'eCom2023$');

    // Take screenshot with filled form
    await page.screenshot({ path: 'login-form-filled.png', fullPage: true });
    console.log('Screenshot with filled form saved');

    // Find and click the login/submit button
    console.log('Clicking login button...');
    const loginSubmitButton = await page.$('button:has-text("Log in"), button[type="submit"]');
    if (loginSubmitButton) {
      await loginSubmitButton.click();
    } else {
      // Try pressing Enter
      await page.press('input[type="password"]', 'Enter');
    }

    // Wait for login to complete and modal to close
    console.log('Waiting for login to complete...');
    try {
      await page.waitForSelector('text=Welcome back!', { state: 'hidden', timeout: 15000 });
      console.log('Login modal closed');
    } catch (e) {
      console.log('Modal may still be open or login failed, continuing...');
    }

    await page.waitForTimeout(3000); // Give extra time for state to settle
    await page.waitForLoadState('networkidle');

    // Take screenshot after login
    await page.screenshot({ path: 'listing-page-after-login.png', fullPage: true });
    console.log('Screenshot after login saved to listing-page-after-login.png');
  }

  // Check if there's any overlay blocking and dismiss it
  console.log('\nStep 4: Checking for overlays...');
  const overlay = await page.$('.signup-modal-overlay');
  if (overlay) {
    console.log('Found overlay, trying to close it...');
    // Try to click outside or press Escape to close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // Check if overlay is still there
    const overlayStillThere = await page.$('.signup-modal-overlay:visible');
    if (overlayStillThere) {
      console.log('Overlay still present, trying to click close button...');
      const closeButton = await page.$('.signup-modal-overlay button:has-text("×"), .signup-modal-overlay .close-button, .signup-modal-overlay [aria-label="Close"]');
      if (closeButton) {
        await closeButton.click();
        await page.waitForTimeout(1000);
      }
    }
  }

  // Take screenshot to see current state
  await page.screenshot({ path: 'before-create-proposal.png', fullPage: true });
  console.log('Screenshot before Create Proposal saved');

  // Now try to click Create Proposal button
  console.log('\nStep 5: Looking for Create Proposal button...');
  createProposalButton = await page.$('button:has-text("Create Proposal")');

  if (createProposalButton) {
    console.log('Found Create Proposal button, scrolling into view...');
    // First scroll the button into view
    await createProposalButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    console.log('Clicking Create Proposal button...');
    // Use force: true to bypass overlay issues
    await createProposalButton.click({ force: true });

    // Wait for any navigation or modal
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    // Take screenshot after clicking Create Proposal
    await page.screenshot({ path: 'after-create-proposal-click.png', fullPage: true });
    console.log('Screenshot after Create Proposal click saved');

    // Check if proposal modal opened
    console.log('\nStep 6: Checking for proposal form modal...');
    const proposalModal = await page.$('text=Why do you want this space');

    if (proposalModal) {
      console.log('Proposal form modal is open, filling form fields...');

      // Fill "Why do you want this space?" field
      const reasonTextarea = await page.$('textarea:near(:text("Why do you want this space"))');
      if (reasonTextarea) {
        await reasonTextarea.fill('I am looking for a comfortable weekly rental in Manhattan for my remote work assignments. This apartment looks perfect for my needs as it has a full kitchen and is in a great location. I appreciate the flexible scheduling options that Split Lease offers and am excited about the possibility of staying here.');
        console.log('Filled "Why do you want this space" field');
      } else {
        // Try alternative selector
        const textareas = await page.$$('textarea');
        if (textareas.length >= 1) {
          await textareas[0].fill('I am looking for a comfortable weekly rental in Manhattan for my remote work assignments. This apartment looks perfect for my needs as it has a full kitchen and is in a great location. I appreciate the flexible scheduling options that Split Lease offers and am excited about the possibility of staying here.');
          console.log('Filled first textarea field');
        }
      }

      // Fill "Tell us about yourself" field
      const aboutTextarea = await page.$('textarea:near(:text("Tell us about yourself"))');
      if (aboutTextarea) {
        await aboutTextarea.fill('I am a software developer working remotely for a tech company. I travel frequently for client meetings and prefer to have a home base in different cities. I am a quiet, respectful tenant who values cleanliness and takes good care of rental properties. I have excellent rental history and references available upon request.');
        console.log('Filled "Tell us about yourself" field');
      } else {
        // Try alternative selector - second textarea
        const textareas = await page.$$('textarea');
        if (textareas.length >= 2) {
          await textareas[1].fill('I am a software developer working remotely for a tech company. I travel frequently for client meetings and prefer to have a home base in different cities. I am a quiet, respectful tenant who values cleanliness and takes good care of rental properties. I have excellent rental history and references available upon request.');
          console.log('Filled second textarea field');
        }
      }

      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'proposal-form-filled.png', fullPage: true });
      console.log('Screenshot of filled form saved');

      // Click Review Proposal button
      console.log('\nStep 7: Clicking Review Proposal button...');
      const reviewButton = await page.$('button:has-text("Review Proposal")');
      if (reviewButton) {
        await reviewButton.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await reviewButton.click({ force: true });

        await page.waitForTimeout(3000);
        await page.waitForLoadState('networkidle');

        await page.screenshot({ path: 'after-review-proposal.png', fullPage: true });
        console.log('Screenshot after Review Proposal click saved');

        // Step 8: Click Submit Proposal button
        console.log('\nStep 8: Looking for Submit Proposal button...');
        const submitButton = await page.$('button:has-text("Submit Proposal")');
        if (submitButton) {
          console.log('Found Submit Proposal button, clicking...');
          await submitButton.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
          await submitButton.click({ force: true });

          console.log('Waiting for submission to complete...');

          // Wait for success indication - could be toast, redirect, or modal change
          await page.waitForTimeout(5000);
          await page.waitForLoadState('networkidle');

          // Take screenshot of success state
          await page.screenshot({ path: 'proposal-submission-result.png', fullPage: true });
          console.log('Screenshot of submission result saved');

          // Check current URL (might have redirected)
          const finalUrl = page.url();
          console.log('Final URL after submission:', finalUrl);

          // Check if "Nice to meet you" profile completion modal appeared
          const profileModal = await page.$('text=Nice to meet you');
          if (profileModal) {
            console.log('\nStep 9: Profile completion modal appeared, filling form...');

            // Get all input fields and log them
            const allInputs = await page.$$('input');
            console.log('Found', allInputs.length, 'input fields total');

            // Log input details for debugging
            for (let i = 0; i < allInputs.length; i++) {
              const placeholder = await allInputs[i].getAttribute('placeholder');
              const name = await allInputs[i].getAttribute('name');
              const type = await allInputs[i].getAttribute('type');
              console.log(`Input ${i}: placeholder="${placeholder}", name="${name}", type="${type}"`);
            }

            // Fill by placeholder or name attribute
            try {
              // First Name
              const firstNameInput = await page.$('input[placeholder="First Name"], input[name="firstName"], input[name="first_name"]');
              if (firstNameInput) {
                await firstNameInput.fill('Frederick');
                console.log('Filled First Name');
              }
            } catch (e) { console.log('First name error:', e.message); }

            try {
              // Last Name
              const lastNameInput = await page.$('input[placeholder="Last Name"], input[name="lastName"], input[name="last_name"]');
              if (lastNameInput) {
                await lastNameInput.fill('Ros');
                console.log('Filled Last Name');
              }
            } catch (e) { console.log('Last name error:', e.message); }

            try {
              // Email - this is the field showing validation error
              const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="Email"]');
              if (emailInput) {
                await emailInput.fill('splitleasefrederick+frederickros@gmail.com');
                console.log('Filled Email');
              }
            } catch (e) { console.log('Email error:', e.message); }

            // Birthday dropdowns - try using page.locator for better selection
            console.log('\nLooking for birthday dropdowns...');
            const selects = await page.$$('select');
            console.log('Found', selects.length, 'select elements');

            // Log select details
            for (let i = 0; i < selects.length; i++) {
              const name = await selects[i].getAttribute('name');
              const id = await selects[i].getAttribute('id');
              console.log(`Select ${i}: name="${name}", id="${id}"`);
            }

            // Try using page.selectOption with locator string
            try {
              await page.selectOption('select >> nth=0', { index: 1 });
              console.log('Selected Month dropdown');
            } catch (e) { console.log('Month selection failed:', e.message.substring(0, 100)); }

            try {
              await page.selectOption('select >> nth=1', { index: 15 });
              console.log('Selected Day dropdown');
            } catch (e) { console.log('Day selection failed:', e.message.substring(0, 100)); }

            try {
              await page.selectOption('select >> nth=2', { index: 30 });
              console.log('Selected Year dropdown');
            } catch (e) { console.log('Year selection failed:', e.message.substring(0, 100)); }

            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'profile-form-filled.png', fullPage: true });
            console.log('Screenshot of filled profile form saved');

            // Click Continue button
            console.log('\nStep 10: Clicking Continue button...');
            const continueButton = await page.$('button:has-text("Continue")');
            if (continueButton) {
              await continueButton.click({ force: true });

              await page.waitForTimeout(5000);
              await page.waitForLoadState('networkidle');

              await page.screenshot({ path: 'after-profile-continue.png', fullPage: true });
              console.log('Screenshot after Continue click saved');

              // Check final URL
              const finalUrl2 = page.url();
              console.log('Final URL after profile completion:', finalUrl2);

              // Check if there's another modal or we're done
              const stillOnModal = await page.$('text=Nice to meet you');
              if (stillOnModal) {
                console.log('Still on profile modal - form may have validation errors');
                // Take another screenshot showing errors
                await page.screenshot({ path: 'profile-validation-errors.png', fullPage: true });
              } else {
                console.log('Profile modal closed - moving forward');
              }
            }
          }

          // Look for success indicators
          const successToast = await page.$('text=success');
          const proposalSubmitted = await page.$('text=Proposal submitted');
          const proposalCreated = await page.$('text=Proposal created');
          const thankYou = await page.$('text=Thank you');
          const confirmation = await page.$('text=confirmation');

          console.log('\nSuccess indicators found:');
          console.log('- Success toast:', !!successToast);
          console.log('- "Proposal submitted" text:', !!proposalSubmitted);
          console.log('- "Proposal created" text:', !!proposalCreated);
          console.log('- "Thank you" text:', !!thankYou);
          console.log('- "confirmation" text:', !!confirmation);

          // Check for any error messages
          const errorMessage = await page.$('.error, .error-message, [class*="error"]');
          if (errorMessage) {
            const errorText = await errorMessage.textContent();
            console.log('\nError message found:', errorText);
          }

        } else {
          console.log('Submit Proposal button not found');

          // Check what buttons are visible
          const allButtons = await page.$$('button');
          console.log('\nVisible buttons:');
          for (const btn of allButtons) {
            const btnText = await btn.textContent();
            if (btnText && btnText.trim()) {
              console.log('-', btnText.trim().substring(0, 50));
            }
          }
        }
      } else {
        console.log('Review Proposal button not found');
      }
    } else {
      console.log('Proposal form modal not found');
    }

    // Check current URL
    const currentUrl = page.url();
    console.log('\nCurrent URL:', currentUrl);

    // Print page content
    const bodyText = await page.textContent('body');
    console.log('\nPage text content (first 2000 chars):');
    console.log(bodyText.substring(0, 2000));
  } else {
    console.log('Create Proposal button not found');

    // Print page content for debugging
    const bodyText = await page.textContent('body');
    console.log('\nPage text content (first 2000 chars):');
    console.log(bodyText.substring(0, 2000));
  }

  // Keep browser open for manual inspection
  console.log('\nBrowser will stay open for 30 seconds for inspection...');
  await new Promise(r => setTimeout(r, 30000));

  await browser.close();
})();
