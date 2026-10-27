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
    renderChunk(code, chunk) {
      // 排除第三方依赖库及包含巨型语法高亮表的文章视图，仅混淆本项目的核心业务代码
      if (
        chunk.fileName.includes('vendor-') ||
        chunk.fileName.includes('marked') ||
        chunk.fileName.includes('highlight') ||
        chunk.fileName.includes('ArticleView') ||
        chunk.fileName.includes('stomp') ||
        chunk.fileName.includes('browser-')
      ) {
        return null;
      }

      const result = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        // 字符串加密池：将字符串转换为 Base64 编码池，打乱顺序并加动态解密层
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

      return {
        code: result.getObfuscatedCode(),
        map: null,
      };
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
