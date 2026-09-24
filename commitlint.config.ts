import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Scopes we recognise in this monorepo
    'scope-enum': [
      2,
      'always',
      ['api', 'web', 'admin', 'shared', 'ui', 'ci', 'assets', 'db', 'docs'],
    ],
    'header-max-length': [2, 'always', 100],
    // Allow Bangla in the subject (body is unrestricted)
    'subject-case': [0],
  },
};

export default config;
