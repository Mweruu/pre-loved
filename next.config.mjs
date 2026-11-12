/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prisma must run as an external package in the server runtime
  serverExternalPackages: ["@prisma/client"],
  experimental: {
    // Allow multi-image uploads through server actions (default is 1mb)
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
