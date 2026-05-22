/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => [
    {
      source: "/api/:path*",
      destination: "http://backend:8000/api/:path*",
    },
  ],
};

export default nextConfig;