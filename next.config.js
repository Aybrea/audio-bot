/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/api/voice-convert': ['./proto/**/*'],
  },
};

module.exports = nextConfig;
