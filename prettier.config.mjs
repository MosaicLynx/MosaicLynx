const config = {
  tabWidth: 2,
  printWidth: 120,
  trailingComma: 'es5',
  semi: true,
  singleQuote: true,
  importOrder: ['^node:(.*)$', '^@core/(.*)$', '^@server/(.*)$', '^@ui/(.*)$', '^@src/(.*)$', '^@test/(.*)$', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  plugins: ['@trivago/prettier-plugin-sort-imports'],
};

export default config;
