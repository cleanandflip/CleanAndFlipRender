// .eslintrc.cjs
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  settings: {
    react: { version: 'detect' },
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      rules: {
        // Place TS-specific rule overrides here if needed
      },
    },
  ],
  ignorePatterns: ['node_modules/', 'dist/', 'build/', 'report/', '.git/', '*.d.ts'],
  rules: {
    '@typescript-eslint/no-unused-expressions': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-unsafe-function-type': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-namespace': 'off',
    'no-useless-escape': 'off',
    'no-case-declarations': 'off',
    'no-empty': 'off',
    'prefer-const': 'off',
    'no-control-regex': 'off',
    'no-useless-catch': 'off',
    'no-restricted-imports': [
      'error',
      {
        paths: [
          { name: '@radix-ui/react-select', message: 'Use src/components/ui/Dropdown instead.' },
          { name: 'headlessui', message: 'Use src/components/ui/Dropdown instead.' },
          { name: '@/components/UnifiedDropdown', message: 'Use src/components/ui/Dropdown instead.' },
          { name: '@/components/StandardDropdown', message: 'Use src/components/ui/Dropdown instead.' },
          { name: '@/components/dropdown-menu', message: 'Use src/components/ui/Dropdown instead.' },
          { name: '@/components/ui/select', message: 'Use src/components/ui/Dropdown instead.' },
        ],
        patterns: [
          // Removed overly-broad "*storage*" restriction to allow server/storage imports
          '*SessionCart*',
          '*cart-legacy*',
          '*addresses-legacy*',
          '*checkout-old*',
          '*checkout-simple*',
          '*onboarding*',
          '*ensureProfileComplete*',
        ],
      },
    ],
  },
};