const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://www.optum.com/en/',
    setupNodeEvents(on, config) {
      return config;
    },
  },
});
