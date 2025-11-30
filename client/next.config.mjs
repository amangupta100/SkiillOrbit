/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000", // Adjust if your dev server uses a different port
        pathname: "/**",
      },
    ],
  },
  // Add this to address the cross-origin warning
  allowedDevOrigins: [
    "http://10.17.24.123:3000", // Adjust port if needed; this allows requests from your local IP
  ],
};

export default nextConfig;
