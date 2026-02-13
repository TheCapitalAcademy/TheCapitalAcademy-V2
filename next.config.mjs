const config = {
    compiler: {
      removeConsole: process.env.NODE_ENV === 'production',
    },
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**',
        },
      ],
      unoptimized: true,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    webpack: (config, { isServer }) => {
      // Disable filesystem cache to prevent cache corruption issues
      config.cache = false;
      return config;
    },
  }

  export default config
  