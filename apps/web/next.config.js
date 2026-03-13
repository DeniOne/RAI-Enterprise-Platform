/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Heavy graph packages noticeably slow down dev compilation on Windows.
    // Keep explicit transpilation only for production builds.
    transpilePackages: process.env.NODE_ENV === 'production'
        ? ['react-force-graph-2d', 'three', 'd3-force']
        : [],
    // Reduce dev-only chunk eviction to avoid transient ChunkLoadError
    // when a tab stays idle and then requests stale on-demand entries.
    onDemandEntries: {
        maxInactiveAge: 1000 * 60 * 60, // 1 hour
        pagesBufferLength: 10,
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://127.0.0.1:4000/api/:path*',
            },
        ]
    },
}

module.exports = nextConfig
