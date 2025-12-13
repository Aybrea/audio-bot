/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/api/voice-convert': ['./proto/**/*'],
  },
};

export default nextConfig;
