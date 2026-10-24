import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({ 
  base: '/admin-Fanek-/', // <--- حدد اسم المستودع بدقة هنا
  plugins: [react()], 
  server: { host: '0.0.0.0' } 
});
