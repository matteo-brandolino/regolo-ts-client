import {includeIgnoreFile} from '@eslint/compat'
import oclif from 'eslint-config-oclif'
import prettier from 'eslint-config-prettier'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore')

export default [
  includeIgnoreFile(gitignorePath),
  ...oclif,
  prettier,
  {
    files: ['**/*.ts'],
    rules: {
      // Allow snake_case property names for objects that mirror external API schemas
      camelcase: ['error', {properties: 'never'}],
      // Public APIs may legitimately require more than 4 parameters
      'max-params': ['warn', {max: 5}],
      // fetch is available (experimental) from Node 18; project targets >=18.0.0
      'n/no-unsupported-features/node-builtins': ['error', {ignores: ['fetch', 'AbortSignal', 'AbortSignal.timeout']}],
      // TypeScript handles undefined variable checks; no-undef causes false positives on global types
      'no-undef': 'off',
    },
  },
]
