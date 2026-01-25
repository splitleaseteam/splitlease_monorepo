/**
 * CSS Modules Type Declaration
 *
 * Declares CSS module imports for TypeScript.
 * This allows TypeScript to understand imports like `import styles from './Component.module.css'`.
 *
 * @see https://github.com/mrmckeb/typescript-plugin-css-modules
 */

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const content: string;
  export default content;
}
