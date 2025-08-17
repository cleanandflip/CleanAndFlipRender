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
          '*storage*',
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