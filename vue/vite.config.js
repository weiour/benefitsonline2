import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [vue()],
    define: {
        VUE_PROD_DEVTOOLS: false
    }
})