/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Heavy graph packages noticeably slow down dev compilation on Windows.
    // Keep explicit transpilation only for production builds.
    transpilePackages: process.env.NODE_ENV === 'production'
        ? ['react-force-graph-2d', 'three', 'd3-force']
        : [],
}

module.exports = nextConfig
