/** @type {import('next').NextConfig} */
const nextConfig = {
    staticPageGenerationTimeout: 150,

    // ✅ This will fix the Cross-Origin warning during dev
    allowedDevOrigins: ['http://10.27.236.253:3000'],
};

export default nextConfig;
