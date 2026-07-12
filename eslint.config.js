import { config } from '@fisch0920/config/eslint'
import nextConfig from 'eslint-config-next/core-web-vitals'

// Extract plugin instances to resolve flat config redefinition conflicts in ESLint 9+
const reactPlugin = config.find((o) => o.plugins && o.plugins.react)?.plugins.react
const reactHooksPlugin = config.find((o) => o.plugins && o.plugins['react-hooks'])?.plugins['react-hooks']
const importPlugin = config.find((o) => o.plugins && o.plugins.import)?.plugins.import
const jsxA11yPlugin = config.find((o) => o.plugins && o.plugins['jsx-a11y'])?.plugins['jsx-a11y']

const cleanedNextConfig = nextConfig.map((c) => {
  if (c.plugins) {
    const newPlugins = { ...c.plugins }
    if (newPlugins.react && reactPlugin) newPlugins.react = reactPlugin
    if (newPlugins['react-hooks'] && reactHooksPlugin) newPlugins['react-hooks'] = reactHooksPlugin
    if (newPlugins.import && importPlugin) newPlugins.import = importPlugin
    if (newPlugins['jsx-a11y'] && jsxA11yPlugin) newPlugins['jsx-a11y'] = jsxA11yPlugin
    return { ...c, plugins: newPlugins }
  }
  return c
})

const eslintConfig = [
  ...config,
  ...cleanedNextConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'react/prop-types': 'off',
      '@next/next/no-img-element': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/prefer-global-this': 'off',
      'no-process-env': 'off',
      'array-callback-return': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/media-has-caption': 'off',
      'jsx-a11y/interactive-supports-focus': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      '@typescript-eslint/naming-convention': 'off'
    }
  }
]

export default eslintConfig
