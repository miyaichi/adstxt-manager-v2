/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // テスト対象のファイルパターン
  testMatch: ['**/**/*.test.ts'],
  // 必要に応じてセットアップファイルを指定
  // setupFilesAfterEnv: ['./jest.setup.ts'],
};
