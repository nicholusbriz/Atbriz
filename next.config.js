/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: [
          {
            loader: "@tailwindcss/turbopack",
          },
        ],
        as: "*.css",
      },
    },
  },
};

module.exports = nextConfig;
