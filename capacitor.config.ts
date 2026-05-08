import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mercabit.app',
  appName: 'MercaBit',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    FirebaseMessaging: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }

};

export default config;
