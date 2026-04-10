import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'HIKAFUWA BOX',
        short_name: 'HIKAFUWA',
        description: '画像をアップロードするだけでAIが爆笑ネタツイートを自動作成！',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#ff00cc',
        icons: [
            {
                src: '/favicon.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/favicon.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
