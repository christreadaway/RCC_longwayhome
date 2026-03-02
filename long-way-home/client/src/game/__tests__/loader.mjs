/**
 * Custom Node.js ESM loader that resolves extensionless imports and Vite aliases.
 * Used for running tests outside of Vite.
 */
import { resolve as nodeResolve, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';

// Vite alias: @shared -> client/src/shared
const CLIENT_SRC = nodeResolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ALIASES = {
  '@shared': nodeResolve(CLIENT_SRC, 'shared'),
};

export async function resolve(specifier, context, nextResolve) {
  // Handle Vite aliases
  for (const [alias, target] of Object.entries(ALIASES)) {
    if (specifier === alias || specifier.startsWith(alias + '/')) {
      const rest = specifier.slice(alias.length);
      let resolved = target + rest;
      if (!resolved.match(/\.\w+$/)) resolved += '.js';
      if (existsSync(resolved)) {
        return { url: pathToFileURL(resolved).href, shortCircuit: true };
      }
    }
  }

  // Handle extensionless relative imports
  if (specifier.startsWith('.') && !specifier.match(/\.\w+$/)) {
    const parentDir = context.parentURL
      ? new URL('.', context.parentURL).pathname
      : process.cwd();
    const candidate = nodeResolve(parentDir, specifier + '.js');
    if (existsSync(candidate)) {
      return { url: pathToFileURL(candidate).href, shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}
