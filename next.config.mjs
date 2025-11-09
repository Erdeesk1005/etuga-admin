/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path',
                destination: 'http://103.50.205.185:3000/api/v1/:path*', // дотоод HTTP
            },
        ];
    },
};

export default nextConfig;
