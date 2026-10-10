import type { StorybookConfig } from '@storybook/react-vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Storybook 10 loads its config as ESM, where __dirname doesn't exist
const dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
    'storybook-addon-pseudo-states'
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
    docs: {},
    viteFinal: async (config) => {
        config.plugins?.push(
            /** @see https://github.com/aleclarson/vite-tsconfig-paths */
            tsconfigPaths({
                projects: [path.resolve(dirname, "..", "tsconfig.json")],
            })
        );

        return config;
    },
};
export default config;