/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  // Allow consuming workspace packages
  transpilePackages: ['@reachinbox/shared'],
};

module.exports = nextConfig;
