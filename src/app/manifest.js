export default function manifest() {
    return {
      name: 'The Capital Academy',
      short_name: 'The Capital Academy',
      description: 'The Capital Academy is Pakistan’s leading online platform for MDCAT, NUMS, and medical entrance exam preparation. With expertly designed video lectures, past paper solutions, real-time practice tests, and performance analytics, we help students succeed in competitive medical exams from the comfort of their home. Join thousands of aspiring doctors preparing with confidence, flexibility, and expert guidance.',
      start_url: '/',
      display: 'standalone',
    //   background_color: '#fff',
    //   theme_color: '#fff',
      icons: [
        {
          src: '/favicon-32x32.png',
          sizes: '32x32',
          type: 'image/png',
        },
          {
          src: '/favicon-16x16.png',
          sizes: '16x16',
          type: 'image/png',
        },
            {
          src: '/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
            {
          src: '/android-chrome-512x512',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    }
  }