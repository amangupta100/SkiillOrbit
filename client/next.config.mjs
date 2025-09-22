/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Images config
  images: {
    domains: ["localhost:3000"], // agar future me aur domains add karne ho to comma separated
  },

  // Proxy backend requests to the Render backend
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          process.env.NODE_ENV === "production"
            ? "https://skiillorbit.onrender.com/:path*"
            : "http://localhost:5000/:path*", // local backend
      },
    ];
  },
};

module.exports = nextConfig;
