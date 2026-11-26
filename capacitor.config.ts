import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.slyhawk.genevievesapothecary',
  appName: "Genevieve's Apothecary",
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
