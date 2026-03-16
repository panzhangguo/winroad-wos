import path from 'node:path'
import { AntdvNextResolver } from '@antdv-next/auto-import-resolver'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

export default defineConfig(() => {
  return {
    server: {
      proxy: {
        '/api': {
          target: 'http://192.168.0.15/api',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          // 输出正式请求路径
          logLevel: 'debug',
          // 开启 HTTPS
          secure: false,
        },
      },
    },
    plugins: [
      vue(),
      tailwindcss(),
      Components({
        dirs: ['src/components/ui', 'src/components/business', 'src/components/layout'],
        resolvers: [AntdvNextResolver()],
        dts: 'src/components.d.ts',
      }),
      AutoImport({
        imports: ['vue', 'vue-router', 'vue-i18n', '@vueuse/core'],
        dts: 'src/auto-imports.d.ts',
      }),
    ],

    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
  }
})
