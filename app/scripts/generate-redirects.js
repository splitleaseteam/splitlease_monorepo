/**
 * Generate Cloudflare Pages _redirects and _routes.json from Route Registry
 *
 * This script is run as a prebuild step to ensure routing files are always
 * in sync with the Route Registry (single source of truth).
 *
 * @see ../src/routes.config.js for the route definitions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { routes, getBasePath, excludedFromFunctions } from '../src/routes.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

/**
 * Generates redirect lines for a single underscore-prefixed route
 */
const generateUnderscoreRouteLines = (route) => {
  const basePath = getBasePath(route);

  const mainLines = (route.cloudflareInternal && route.internalName)
    ? [
        `# ${basePath} → ${route.file}`,
        `${basePath}  /_internal/${route.internalName}  200`,
        `${basePath}/  /_internal/${route.internalName}  200`
      ]
    : (() => {
        // For non-cloudflareInternal underscore routes, use _internal pattern anyway
        // to avoid Cloudflare's restriction on serving underscore-prefixed files
        const internalName = route.file.replace('.html', '-view').replace(/^_/, '');
        return [
          `# ${basePath} → ${route.file} (auto-converted to _internal pattern)`,
          `${basePath}  /_internal/${internalName}  200`,
          `${basePath}/  /_internal/${internalName}  200`
        ];
      })();

  // Process aliases for underscore routes
  const aliasLines = (route.aliases && route.aliases.length > 0)
    ? (() => {
        const target = route.cloudflareInternal && route.internalName
          ? `/_internal/${route.internalName}`
          : `/_internal/${route.file.replace('.html', '-view').replace(/^_/, '')}`;

        return route.aliases.flatMap((alias) => {
          if (alias === `${basePath}.html` || alias === basePath) return [];
          if (alias.startsWith(basePath)) return [];

          return [
            `# Alias: ${alias} → ${route.file}`,
            `${alias}  ${target}  200`,
            ...(!alias.endsWith('.html') ? [`${alias}/  ${target}  200`] : [])
          ];
        });
      })()
    : [];

  return [...mainLines, ...aliasLines, ''];
};

/**
 * Generates redirect lines for a single dynamic route
 */
const generateDynamicRouteLines = (route) => {
  const basePath = getBasePath(route);

  // Special case: /help-center/:category only needs the wildcard rule
  // The base /help-center is handled separately as a static route
  if (route.path === '/help-center/:category') {
    return [
      `# ${route.path} → ${route.file} (wildcard only, base handled separately)`,
      `${basePath}/*  /_internal/${route.internalName}  200`,
      ''
    ];
  }

  if (route.cloudflareInternal && route.internalName) {
    // Use _internal/ directory to avoid Cloudflare's "pretty URL" normalization
    // Content-Type is set via _headers file, not file extension
    return [
      `# ${route.path} → ${route.file}`,
      `${basePath}  /_internal/${route.internalName}  200`,
      `${basePath}/  /_internal/${route.internalName}  200`,
      `${basePath}/*  /_internal/${route.internalName}  200`,
      ''
    ];
  }

  // Direct rewrite to HTML file
  return [
    `# ${route.path} → ${route.file}`,
    `${basePath}/*  /${route.file}  200`,
    ''
  ];
};

/**
 * Generates redirect lines for a single static route
 */
const generateStaticRouteLines = (route) => {
  const basePath = getBasePath(route);

  // Cloudflare serves .html files directly
  const mainLines = (basePath === '/')
    ? [
        '# Homepage',
        '/  /index.html  200',
        '/index.html  /index.html  200',
        ''
      ]
    : (route.cloudflareInternal && route.internalName)
      ? [
          // Content-Type is set via _headers file, not file extension
          `# ${basePath} → ${route.file}`,
          `${basePath}  /_internal/${route.internalName}  200`,
          `${basePath}/  /_internal/${route.internalName}  200`,
          ''
        ]
      : [
          // Add rewrites for both clean URL and .html extension
          `# ${basePath}`,
          `${basePath}  /${route.file}  200`,
          `${basePath}/  /${route.file}  200`,
          `${basePath}.html  /${route.file}  200`,
          ''
        ];

  // Process aliases that differ from the base path
  // This ensures alternative URLs (e.g., /verify-users for /_internal/verify-users) work
  const aliasLines = (route.aliases && route.aliases.length > 0)
    ? (() => {
        const target = route.cloudflareInternal && route.internalName
          ? `/_internal/${route.internalName}`
          : `/${route.file}`;

        return route.aliases.flatMap((alias) => {
          // Skip aliases that are just the basePath with .html extension
          if (alias === `${basePath}.html` || alias === basePath) return [];
          // Skip aliases already covered by the main path rules
          if (alias.startsWith(basePath)) return [];

          return [
            `# Alias: ${alias} → ${route.file}`,
            `${alias}  ${target}  200`,
            // Add trailing slash variant if alias doesn't end with .html
            ...(!alias.endsWith('.html') ? [`${alias}/  ${target}  200`] : []),
            ''
          ];
        });
      })()
    : [];

  return [...mainLines, ...aliasLines];
};

/**
 * Generates Cloudflare Pages _redirects file from Route Registry
 */
function generateRedirects() {
  // Group routes by type for organized output
  // IMPORTANT: Underscore-prefixed routes MUST come first due to Cloudflare processing quirks
  const dynamicRoutes = routes.filter(r => r.hasDynamicSegment && !r.devOnly);
  const staticRoutes = routes.filter(r => !r.hasDynamicSegment && !r.devOnly);

  // Separate underscore-prefixed routes (must come first for Cloudflare compatibility)
  const underscoreRoutes = staticRoutes.filter(r => getBasePath(r).startsWith('/_'));
  const regularStaticRoutes = staticRoutes.filter(r => !getBasePath(r).startsWith('/_'));

  const lines = [
    '# Cloudflare Pages redirects and rewrites',
    '# AUTO-GENERATED from routes.config.js - DO NOT EDIT MANUALLY',
    '#',
    '# See: https://developers.cloudflare.com/pages/configuration/redirects/',
    '',
    // Underscore-prefixed routes FIRST (Cloudflare has issues with these if they come later)
    '# ===== UNDERSCORE-PREFIXED INTERNAL ROUTES =====',
    '# These routes MUST come first due to Cloudflare\'s handling of underscore paths',
    '',
    ...underscoreRoutes.flatMap(generateUnderscoreRouteLines),
    // Dynamic routes second (more specific) - these need special handling
    '# ===== DYNAMIC ROUTES (with parameters) =====',
    '# These routes use _internal/ files to avoid Cloudflare\'s 308 redirects',
    '',
    ...dynamicRoutes.flatMap(generateDynamicRouteLines),
    // Static routes (excluding underscore-prefixed, which are handled above)
    '# ===== STATIC PAGES =====',
    '',
    ...regularStaticRoutes.flatMap(generateStaticRouteLines),
    '# Note: Cloudflare Pages automatically serves /404.html for not found routes',
    '# No explicit catch-all rule needed - native 404.html support handles this'
  ];

  const content = lines.join('\n');
  const outputPath = path.join(publicDir, '_redirects');

  fs.writeFileSync(outputPath, content);
  console.log('✅ Generated _redirects file from Route Registry');
  console.log(`   ${dynamicRoutes.length} dynamic routes, ${staticRoutes.length} static routes`);
}

/**
 * Generates Cloudflare Pages _routes.json from Route Registry
 */
function generateRoutesJson() {
  // Get unique exclusions
  const uniqueExclusions = [...new Set(excludedFromFunctions)];

  const routesJson = {
    version: 1,
    include: ['/api/*'],
    exclude: uniqueExclusions
  };

  const content = JSON.stringify(routesJson, null, 2) + '\n';
  const outputPath = path.join(publicDir, '_routes.json');

  fs.writeFileSync(outputPath, content);
  console.log('✅ Generated _routes.json file from Route Registry');
  console.log(`   Excluded ${uniqueExclusions.length} routes from Cloudflare Functions`);
}

/**
 * Validate Route Registry
 * Ensures all routes are properly defined
 */
function validateRoutes() {
  const errors = [];
  const paths = new Set();

  for (const route of routes) {
    // Check for duplicate paths
    if (paths.has(route.path)) {
      errors.push(`Duplicate path: ${route.path}`);
    }
    paths.add(route.path);

    // Check required fields
    if (!route.path) {
      errors.push(`Route missing path`);
    }
    if (!route.file) {
      errors.push(`Route ${route.path} missing file`);
    }

    // Check cloudflareInternal requires internalName
    if (route.cloudflareInternal && !route.internalName) {
      errors.push(`Route ${route.path} has cloudflareInternal but no internalName`);
    }
  }

  if (errors.length > 0) {
    console.error('❌ Route Registry validation failed:');
    errors.forEach(e => console.error(`   - ${e}`));
    process.exit(1);
  }

  console.log('✅ Route Registry validation passed');
  console.log(`   ${routes.length} routes defined`);
}

// Run generators
console.log('\n🔧 Generating routing files from Route Registry...\n');

validateRoutes();
generateRedirects();
generateRoutesJson();

console.log('\n✨ Routing files generated successfully!\n');
