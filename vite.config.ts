import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import JavaScriptObfuscator from 'javascript-obfuscator';

function obfuscatorPlugin(): Plugin {
  return {
    name: 'vite-plugin-javascript-obfuscator',
    apply: 'build',
    enforce: 'post',
    generateBundle(options, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') continue;

        // 排除第三方依赖库及文章高亮视图
        if (
          fileName.includes('vendor-') ||
          fileName.includes('marked') ||
          fileName.includes('highlight') ||
          fileName.includes('ArticleView') ||
          fileName.includes('stomp') ||
          fileName.includes('browser-')
        ) {
          continue;
        }

        try {
          const result = JavaScriptObfuscator.obfuscate(chunk.code, {
            compact: true,
            // 字符串加密池
            stringArray: true,
            stringArrayEncoding: ['base64'],
            stringArrayThreshold: 0.8,
            stringArrayRotate: true,
            stringArrayShuffle: true,
            stringArrayWrappersCount: 2,
            stringArrayWrappersType: 'variable',

            // 标识符十六进制混淆
            identifierNamesGenerator: 'hexadecimal',

            // 控制流保持适度，保证运行时高性能
            controlFlowFlattening: false,
            deadCodeInjection: false,

            // 移除调试控制台输出
            disableConsoleOutput: true,

            sourceMap: false,
          });

          chunk.code = result.getObfuscatedCode();
        } catch (err) {
          console.error(`Failed to obfuscate chunk ${fileName}:`, err);
        }
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), obfuscatorPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');
            if (normalizedId.includes('/node_modules/')) {
              if (
                normalizedId.includes('/node_modules/react/') ||
                normalizedId.includes('/node_modules/react-dom/') ||
                normalizedId.includes('/node_modules/scheduler/')
              ) {
                return 'vendor-react';
              }
              if (normalizedId.includes('/node_modules/motion/')) {
                return 'vendor-motion';
              }
              if (
                normalizedId.includes('/node_modules/lucide-react/') ||
                normalizedId.includes('/node_modules/react-icons/')
              ) {
                return 'vendor-icons';
              }
            }
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  };
});
