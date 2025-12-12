/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/voice-convert': ['./proto/**/*'],
    },
  },
};

module.exports = nextConfig;
