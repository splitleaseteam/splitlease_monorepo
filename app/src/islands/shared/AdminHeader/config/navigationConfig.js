import {
  MessageSquare,
  Users,
  FileText,
  Calendar,
  Settings,
  AlertTriangle,
  Home,
  DollarSign,
  Mail,
  Shield,
  Star,
  UserCheck,
  Building,
  Edit3,
  Send,
  UserPlus,
  Wrench,
  TestTube,
  Bot,
  Sparkles,
  FlaskConical,
  Database,
} from 'lucide-react';

export const corporatePages = [
  {
    id: 'admin-threads',
    name: 'Admin Threads',
    path: '/_admin-threads',
    icon: MessageSquare,
    description: 'Manage all messaging threads',
    bubbleUrl: 'https://app.split.lease/version-test/_quick-threads-manage'
  },
  {
    id: 'co-host-requests',
    name: 'Co-Host Requests',
    path: '/_co-host-requests',
    icon: UserPlus,
    description: 'Review co-host partnership requests',
    bubbleUrl: 'https://app.split.lease/version-test/_co-host-requests'
  },
  {
    id: 'create-document',
    name: 'Create Document',
    path: '/_create-document',
    icon: FileText,
    description: 'Generate contracts and documents',
    bubbleUrl: 'https://app.split.lease/version-test/_create-document'
  },
  {
    id: 'create-suggested-proposal',
    name: 'Create Suggested Proposal',
    path: '/_create-suggested-proposal',
    icon: Sparkles,
    description: 'Generate AI-suggested booking proposals',
    bubbleUrl: null
  },
  {
    id: 'emergency',
    name: 'Emergency Management',
    path: '/_emergency',
    icon: AlertTriangle,
    description: 'Handle emergency reports and incidents',
    bubbleUrl: 'https://app.split.lease/version-test/_internal-emergency'
  },
  {
    id: 'experience-responses',
    name: 'Experience Responses',
    path: '/_experience-responses',
    icon: Star,
    description: 'Review guest experience feedback',
    bubbleUrl: 'https://app.split.lease/version-test/_experience-responses'
  },
  {
    id: 'guest-relationships',
    name: 'Guest Relationships',
    path: '/_guest-relationships',
    icon: Users,
    description: 'Manage guest relationships and history',
    bubbleUrl: 'https://app.split.lease/version-test/_guest-relationships-overview'
  },
  {
    id: 'leases-overview',
    name: 'Leases Overview',
    path: '/_leases-overview',
    icon: FileText,
    description: 'View all active and past leases',
    bubbleUrl: 'https://app.split.lease/version-test/_leases-overview'
  },
  {
    id: 'listings-overview',
    name: 'Listings Overview',
    path: '/_listings-overview',
    icon: Building,
    description: 'Manage all property listings',
    bubbleUrl: 'https://app.split.lease/version-test/_listings-overview'
  },
  {
    id: 'manage-leases-payment-records',
    name: 'Manage Leases & Payments',
    path: '/_manage-leases-payment-records',
    icon: DollarSign,
    description: 'Manage lease details, payment records, stays, and documents',
    bubbleUrl: 'https://app.split.lease/version-test/_quick-lease-and-payment-records-manage'
  },
  {
    id: 'manage-informational-texts',
    name: 'Manage Informational Texts',
    path: '/_manage-informational-texts',
    icon: Edit3,
    description: 'Edit site-wide informational content',
    bubbleUrl: 'https://app.split.lease/version-test/_add-informational-texts'
  },
  {
    id: 'manage-rental-applications',
    name: 'Manage Rental Applications',
    path: '/_manage-rental-applications',
    icon: Shield,
    description: 'Review and process rental applications',
    bubbleUrl: 'https://app.split.lease/version-test/_rental-app-manage'
  },
  {
    id: 'manage-virtual-meetings',
    name: 'Manage Virtual Meetings',
    path: '/_manage-virtual-meetings',
    icon: Calendar,
    description: 'Schedule and manage virtual property tours',
    bubbleUrl: 'https://app.split.lease/version-test/_manage-virtual-meetings'
  },
  {
    id: 'message-curation',
    name: 'Message Curation',
    path: '/_message-curation',
    icon: Mail,
    description: 'Curate and moderate platform messages',
    bubbleUrl: 'https://app.split.lease/version-test/_message-curation'
  },
  {
    id: 'modify-listings',
    name: 'Modify Listings',
    path: '/_modify-listings',
    icon: Settings,
    description: 'Bulk edit listing properties',
    bubbleUrl: 'https://app.split.lease/version-test/_modify-listings'
  },
  {
    id: 'proposal-manage',
    name: 'Proposal Management',
    path: '/_proposal-manage',
    icon: FileText,
    description: 'Manage all booking proposals',
    bubbleUrl: 'https://app.split.lease/version-test/_proposal-manage'
  },
  {
    id: 'quick-price',
    name: 'Quick Price Calculator',
    path: '/_quick-price',
    icon: DollarSign,
    description: 'Calculate pricing scenarios',
    bubbleUrl: 'https://app.split.lease/version-test/_quick-price'
  },
  {
    id: 'send-magic-login-links',
    name: 'Send Magic Login Links',
    path: '/_send-magic-login-links',
    icon: Send,
    description: 'Send passwordless login links to users',
    bubbleUrl: 'https://app.split.lease/version-test/_send-magic-login-links'
  },
  {
    id: 'verify-users',
    name: 'Verify Users',
    path: '/_verify-users',
    icon: UserCheck,
    description: 'Verify user identities and documents',
    bubbleUrl: 'https://app.split.lease/version-test/_verify-users'
  },
];

export const unitTestPages = [
  {
    id: 'ai-tools',
    name: 'AI Tools',
    path: '/_ai-tools',
    icon: Bot,
    description: 'AI-powered admin utilities',
    bubbleUrl: null
  },
  {
    id: 'email-sms-unit',
    name: 'Email & SMS Unit Tests',
    path: '/_email-sms-unit',
    icon: Mail,
    description: 'Test email templates and SMS messages',
    bubbleUrl: 'https://app.split.lease/version-test/_email-sms-unit'
  },
  {
    id: 'guest-simulation',
    name: 'Guest Simulation',
    path: '/_guest-simulation',
    icon: Users,
    description: 'Simulate guest booking workflows',
    bubbleUrl: 'https://app.split.lease/version-test/simulation-guest-proposals-mobile-day1'
  },
  {
    id: 'internal-test',
    name: 'Internal Test Page',
    path: '/_internal-test',
    icon: TestTube,
    description: 'General testing and QA page',
    bubbleUrl: null
  },
  {
    id: 'pricing-unit-test',
    name: 'Pricing Unit Test',
    path: '/_pricing-unit-test',
    icon: DollarSign,
    description: 'Test pricing engine calculations and validation',
    bubbleUrl: 'https://app.split.lease/version-test/z-pricing-unit-test'
  },
  {
    id: 'simulation-admin',
    name: 'Simulation Admin',
    path: '/_simulation-admin',
    icon: Wrench,
    description: 'Admin simulation controls',
    bubbleUrl: 'https://app.split.lease/version-test/_simulation-admin'
  },
  {
    id: 'usability-data-management',
    name: 'Usability Data Management',
    path: '/_usability-data-management',
    icon: Database,
    description: 'Manage usability testing data',
    bubbleUrl: 'https://app.split.lease/version-test/_usability-data'
  },
];

export const navigationConfig = {
  corporatePages,
  unitTestPages,
  dropdowns: [
    {
      id: 'corporate-pages',
      label: 'Corporate Pages',
      items: corporatePages,
    },
    {
      id: 'unit-tests',
      label: 'Unit Tests',
      items: unitTestPages,
    },
  ],
};

export function getCurrentPage(currentPath) {
  const allPages = [...corporatePages, ...unitTestPages];
  return allPages.find((page) => page.path === currentPath) || null;
}
