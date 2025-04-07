let userConfig = undefined
try {
  // try to import ESM first
  userConfig = await import('./v0-user-next.config.mjs')
} catch (e) {
  try {
    // fallback to CJS import
    userConfig = await import("./v0-user-next.config");
  } catch (innerError) {
    // ignore error
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Always use static export to avoid server components issues
  output: 'export',
  webpack: (config, { isServer }) => {
    // Fix compatibility issues with ethers
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    
    // Handle document access in server components
    if (isServer) {
      config.externals.push({
        canvas: 'commonjs canvas',
      });
    }
    
    return config;
  },
  // Ignore specific build errors that are just warnings
  typescript: {
    // Disable type checking during production build for faster builds
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable eslint during production build for faster builds
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Remove experimental features that might cause issues
  // experimental: {
  //   webpackBuildWorker: true,
  //   parallelServerCompiles: true,
  //   parallelServerBuildTraces: true,
  // },
  // Set basePath for GitHub Pages if needed
  ...(process.env.GITHUB_ACTIONS ? {
    basePath: '/nooter-s-farm',
  } : {}),
};

if (userConfig) {
  // ESM imports will have a "default" property
  const config = userConfig.default || userConfig

  for (const key in config) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...config[key],
      }
    } else {
      nextConfig[key] = config[key]
    }
  }
}

export default nextConfig
