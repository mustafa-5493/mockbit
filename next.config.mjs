/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      // Self-healing redirect: If browser has a cached 301 redirect from old /dashboard -> /profile,
      // redirect /profile back to /dashboard cleanly.
      { source: "/profile", destination: "/dashboard", permanent: false },
    ];
  },
};

export default nextConfig;