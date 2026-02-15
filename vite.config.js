const { resolve } = require("node:path");
const { defineConfig } = require("vite");

module.exports = defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        question: resolve(__dirname, "question.html"),
        trivia: resolve(__dirname, "trivia.html"),
        finale: resolve(__dirname, "finale.html"),
      },
    },
  },
});
