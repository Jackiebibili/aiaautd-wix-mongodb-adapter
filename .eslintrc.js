module.exports = {
  extends: ['standard', 'plugin:node/recommended', 'prettier'],
  rules: {
    camelcase: 'off',
    'no-fallthrough': 'off',
    'prettier/prettier': ['error'],
  },
  plugins: ['prettier'],
};
