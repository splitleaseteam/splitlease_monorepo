# Component Hierarchy

This document describes the React component architecture in Split Lease.

## Islands Architecture Overview

Split Lease uses an "Islands Architecture" where each page is an independent React application:

```mermaid
flowchart TB
    subgraph "Browser"
        subgraph "Page 1 (index.html)"
            Root1[div#root]
            HP[HomePage]
        end

        subgraph "Page 2 (search.html)"
            Root2[div#root]
            SP[SearchPage]
        end

        subgraph "Page 3 (view-split-lease.html)"
            Root3[div#root]
            VSL[ViewSplitLeasePage]
        end
    end

    subgraph "Navigation"
        Nav[Full Page Load]
    end

    HP -->|href=/search| Nav
    Nav -->|loads| SP
    SP -->|href=/view-split-lease/123| Nav
    Nav -->|loads| VSL
```

## Page Component Structure

Each page follows the "Hollow Component" pattern:

```mermaid
flowchart TB
    subgraph "Entry Point (src/view-split-lease.jsx)"
        Import[import ViewSplitLeasePage]
        CreateRoot[createRoot]
        Render[render]
    end

    subgraph "Page Component (islands/pages/ViewSplitLeasePage/)"
        Page[ViewSplitLeasePage.jsx]
        Logic[useViewSplitLeasePageLogic.js]
        Styles[ViewSplitLeasePage.css]
    end

    subgraph "Shared Components"
        Header[Header]
        Footer[Footer]
        Modals[Modal Components]
    end

    CreateRoot --> Render
    Render --> Page
    Page -->|"const logic = useLogic()"| Logic
    Page --> Header
    Page --> Footer
    Page --> Modals
```

## Component Categories

### 1. Page Components (`islands/pages/`)

```mermaid
flowchart TB
    subgraph "Public Pages"
        HP[HomePage]
        SP[SearchPage]
        VSL[ViewSplitLeasePage]
        FAQ[FAQPage]
        HC[HelpCenterPage]
    end

    subgraph "Guest Pages"
        GP[GuestProposalsPage]
        FL[FavoriteListingsPage]
        RA[RentalApplicationPage]
    end

    subgraph "Host Pages"
        HPP[HostProposalsPage]
        HO[HostOverviewPage]
        LD[ListingDashboardPage]
        SL[SelfListingPage]
    end

    subgraph "Account Pages"
        AP[AccountProfilePage]
        RP[ResetPasswordPage]
    end
```

### 2. Shared Components (`islands/shared/`)

```mermaid
flowchart TB
    subgraph "Layout"
        Header[Header]
        Footer[Footer]
        PageWrapper[PageWrapper]
    end

    subgraph "UI Elements"
        Button[Button]
        DayButton[DayButton]
        Chip[Chip]
        Badge[Badge]
        Toast[Toast]
    end

    subgraph "Display"
        PriceDisplay[PriceDisplay]
        StatusBadge[StatusBadge]
        Avatar[Avatar]
        ImageCarousel[ImageCarousel]
    end

    subgraph "Inputs"
        SearchInput[SearchInput]
        DatePicker[DatePicker]
        Dropdown[Dropdown]
    end

    subgraph "Feedback"
        LoadingSpinner[LoadingSpinner]
        ErrorBoundary[ErrorBoundary]
        EmptyState[EmptyState]
    end
```

### 3. Modal Components (`islands/modals/`)

```mermaid
flowchart TB
    subgraph "Auth Modals"
        Login[LoginModal]
        Signup[SignupModal]
        ForgotPassword[ForgotPasswordModal]
    end

    subgraph "Booking Modals"
        CreateProposal[CreateProposalFlowV2]
        ViewProposal[ViewProposalModal]
        Counteroffer[CounterofferModal]
    end

    subgraph "Action Modals"
        Cancel[CancelProposalModal]
        Confirm[ConfirmationModal]
        VM[VirtualMeetingModal]
    end

    subgraph "Info Modals"
        InfoText[InformationalTextModal]
        Map[MapModal]
        Gallery[GalleryModal]
    end
```

## Header Component Hierarchy

```mermaid
flowchart TB
    subgraph "Header"
        H[Header]
        Logo[Logo]
        Nav[Navigation]
        Auth[Auth Section]
    end

    subgraph "Navigation Items"
        Search[Search Link]
        List[List With Us]
        Help[Help Center]
    end

    subgraph "Auth Section"
        LoggedOut[Login/Signup Buttons]
        LoggedIn[LoggedInAvatar]
    end

    subgraph "LoggedInAvatar"
        Avatar[User Avatar]
        Dropdown[Dropdown Menu]
        Menu[Menu Items]
    end

    H --> Logo
    H --> Nav
    H --> Auth

    Nav --> Search
    Nav --> List
    Nav --> Help

    Auth -->|not logged in| LoggedOut
    Auth -->|logged in| LoggedIn

    LoggedIn --> Avatar
    LoggedIn --> Dropdown
    Dropdown --> Menu
```

## Proposal Card Hierarchy

```mermaid
flowchart TB
    subgraph "ProposalCard"
        PC[ProposalCard]
        Header[Card Header]
        Body[Card Body]
        Actions[Card Actions]
    end

    subgraph "Header Components"
        Status[StatusBadge]
        Stage[StageIndicator]
        Date[DateDisplay]
    end

    subgraph "Body Components"
        Listing[ListingPreview]
        Schedule[ScheduleDisplay]
        Price[PriceBreakdown]
    end

    subgraph "Action Components"
        Primary[PrimaryButton]
        Secondary[SecondaryButton]
        More[MoreOptions]
    end

    PC --> Header
    PC --> Body
    PC --> Actions

    Header --> Status
    Header --> Stage
    Header --> Date

    Body --> Listing
    Body --> Schedule
    Body --> Price

    Actions --> Primary
    Actions --> Secondary
    Actions --> More
```

## Create Proposal Flow

```mermaid
flowchart TB
    subgraph "CreateProposalFlowV2"
        Flow[CreateProposalFlowV2]
        Step1[Step 1: Schedule]
        Step2[Step 2: Move-in Date]
        Step3[Step 3: Review]
    end

    subgraph "Schedule Step"
        DaySelector[DaySelector]
        DayButtons[DayButton x 7]
        NightDisplay[Night Count]
    end

    subgraph "Move-in Step"
        Calendar[Calendar Component]
        DatePicker[Move-in Picker]
        Duration[Duration Selector]
    end

    subgraph "Review Step"
        Summary[Proposal Summary]
        Pricing[Pricing Breakdown]
        Terms[Terms Checkbox]
        Submit[Submit Button]
    end

    Flow --> Step1
    Flow --> Step2
    Flow --> Step3

    Step1 --> DaySelector
    DaySelector --> DayButtons
    DaySelector --> NightDisplay

    Step2 --> Calendar
    Step2 --> DatePicker
    Step2 --> Duration

    Step3 --> Summary
    Step3 --> Pricing
    Step3 --> Terms
    Step3 --> Submit
```

## Listing Card Component

```mermaid
flowchart TB
    subgraph "ListingCard"
        LC[ListingCard]
        Image[ImageCarousel]
        Info[ListingInfo]
        Price[PriceDisplay]
        Actions[CardActions]
    end

    subgraph "ImageCarousel"
        Slides[Image Slides]
        Nav[Navigation Dots]
        Arrows[Prev/Next Arrows]
    end

    subgraph "ListingInfo"
        Title[Listing Title]
        Location[Borough/Neighborhood]
        Amenities[Amenity Tags]
        Schedule[Available Days]
    end

    subgraph "CardActions"
        Favorite[Favorite Button]
        Book[Book Button]
        Share[Share Button]
    end

    LC --> Image
    LC --> Info
    LC --> Price
    LC --> Actions

    Image --> Slides
    Image --> Nav
    Image --> Arrows

    Info --> Title
    Info --> Location
    Info --> Amenities
    Info --> Schedule
```

## Component Communication Patterns

### Parent to Child (Props)

```mermaid
flowchart LR
    Parent[Parent Component]
    Child[Child Component]

    Parent -->|"props.data"| Child
    Parent -->|"props.onChange"| Child
```

### Child to Parent (Callbacks)

```mermaid
flowchart LR
    Parent[Parent Component]
    Child[Child Component]

    Parent -->|"onSelect={handler}"| Child
    Child -->|"onSelect(value)"| Parent
```

### Sibling Communication (Lift State)

```mermaid
flowchart TB
    Parent[Parent Component]
    SibA[Sibling A]
    SibB[Sibling B]

    Parent -->|"value"| SibA
    Parent -->|"value"| SibB
    SibA -->|"onChange"| Parent
```

## Custom Hooks Pattern

```mermaid
flowchart TB
    subgraph "Page Component"
        Page[ViewSplitLeasePage]
    end

    subgraph "Logic Hook"
        Hook[useViewSplitLeasePageLogic]
        State[useState]
        Effects[useEffect]
        Handlers[Event Handlers]
    end

    subgraph "Shared Hooks"
        Auth[useAuthenticatedUser]
        Device[useDeviceDetection]
        Carousel[useImageCarousel]
    end

    Page -->|"const logic ="| Hook
    Hook --> State
    Hook --> Effects
    Hook --> Handlers
    Hook --> Auth
    Hook --> Device
```

## File Organization

```
islands/
├── pages/
│   ├── HomePage/
│   │   ├── HomePage.jsx
│   │   ├── useHomePageLogic.js
│   │   └── HomePage.css
│   ├── SearchPage/
│   │   ├── SearchPage.jsx
│   │   ├── useSearchPageLogic.js
│   │   ├── components/
│   │   │   ├── SearchFilters.jsx
│   │   │   └── SearchResults.jsx
│   │   └── SearchPage.css
│   └── ...
├── shared/
│   ├── Header/
│   │   ├── Header.jsx
│   │   └── Header.css
│   ├── Button/
│   │   ├── Button.jsx
│   │   └── Button.css
│   └── ...
├── modals/
│   ├── LoginModal/
│   │   ├── LoginModal.jsx
│   │   └── LoginModal.css
│   └── ...
└── proposals/
    ├── ProposalCard.jsx
    ├── ProposalList.jsx
    └── ...
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Page Component | PascalCase + "Page" | `SearchPage.jsx` |
| Logic Hook | "use" + ComponentName + "Logic" | `useSearchPageLogic.js` |
| Shared Component | PascalCase | `Button.jsx` |
| Modal Component | PascalCase + "Modal" | `LoginModal.jsx` |
| CSS File | Same as component | `SearchPage.css` |
| Test File | Component + ".test" | `Button.test.jsx` |
| Story File | Component + ".stories" | `Button.stories.jsx` |

## Key Design Principles

1. **Hollow Components**: Page components contain no business logic
2. **Single Responsibility**: Each component does one thing well
3. **Composition over Inheritance**: Build complex UIs from simple components
4. **Co-location**: Keep related files together (component, hook, styles)
5. **Explicit Props**: Avoid prop drilling; lift state appropriately
