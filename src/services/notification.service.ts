import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
// @ts-ignore
import { messaging } from '../firebase/FirebaseConfig';
// @ts-ignore
import { db } from '../firebase/FirebaseConfig';
import { triggerNotification } from '../composables/useInAppNotification';

class NotificationService {
  private vapidKey = 'BHYPMBeNadDFf05IRAfcdIASTjjgtHFpU3EzW8OI6A1r23m4OCUpst64QdNsZYOZK-MGY5LLk6pF5wOoZejsD64';
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    this.initialized = true;

    if (Capacitor.isNativePlatform()) {
      await this.initializeNative();
    } else {
      await this.initializeWeb();
    }
  }

  private async initializeNative() {
    try {
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== 'granted') {
        console.log('Permiso denegado para notificaciones nativas');
        return;
      }

      await PushNotifications.register();

      PushNotifications.addListener('registration', (token) => {
        console.log('Token nativo:', token.value);
        this.saveTokenToDatabase(token.value);
      });

      // Foreground: mostrar notificación flotante dentro de la app
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        triggerNotification(
          notification.title || 'MercaBit',
          notification.body || ''
        );
      });

      // Background/killed: usuario toca la notificación → abrir app y navegar
      PushNotifications.addListener('pushNotificationActionPerformed', () => {
        window.location.href = '/Notification';
      });

    } catch (error) {
      console.error('Error en inicialización nativa:', error);
    }
  }

  private async initializeWeb() {
    try {
      // Verificar si el navegador soporta service workers y notificaciones
      if (!('serviceWorker' in navigator) || !('Notification' in window)) {
        console.warn('Este navegador no soporta notificaciones push');
        return;
      }

      // Registrar service worker con manejo de error silencioso
      let swRegistration;
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      } catch (swError) {
        console.warn('Service worker no disponible en desarrollo:', swError);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Permiso para notificaciones web denegado');
        return;
      }

      // Obtener token con manejo de error silencioso para app-offline
      let token;
      try {
        token = await getToken(messaging, {
          vapidKey: this.vapidKey,
          serviceWorkerRegistration: await navigator.serviceWorker.ready,
        });
      } catch (tokenError: any) {
        // Error app-offline es normal en desarrollo, no interrumpir la app
        if (tokenError?.code === 'installations/app-offline' || 
            tokenError?.message?.includes('app-offline')) {
          console.warn('FCM no disponible offline — notificaciones push desactivadas');
          return;
        }
        throw tokenError;
      }

      if (token) {
        console.log('Token web:', token);
        this.saveTokenToDatabase(token);

        // Foreground web: mostrar notificación flotante en vez de notificación del navegador
        onMessage(messaging, (payload) => {
          triggerNotification(
            payload.notification?.title || 'MercaBit',
            payload.notification?.body || ''
          );
        });
      }

    } catch (error) {
      // Error silencioso — no interrumpir el flujo de la app
      console.warn('Notificaciones web no disponibles:', error);
    }
  }

  private async saveTokenToDatabase(token: string) {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.warn("No hay usuario autenticado.");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { fcmToken: token }, { merge: true });
      console.log("Token guardado para el usuario:", user.uid);
    } catch (error) {
      console.warn('Error guardando token:', error);
    }
  }

  async subscribeTopic(topic: string): Promise<boolean> {
    try {
      if (!topic) throw new Error('Tema inválido');

      if (Capacitor.isNativePlatform()) {
        await FirebaseMessaging.subscribeToTopic({ topic });
        console.log(`Suscrito a ${topic} (nativo)`);
        return true;
      } else {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');

        const db = getFirestore();
        await setDoc(doc(db, 'users', user.uid), {
          [`topics.${topic}`]: true
        }, { merge: true });

        console.log(`Suscrito a ${topic} (web)`);
        return true;
      }
    } catch (error) {
      console.error('Error suscribiéndose a tema:', error);
      return false;
    }
  }

  async unsubscribeTopic(topic: string): Promise<boolean> {
    try {
      if (!topic) throw new Error('Tema inválido');

      if (Capacitor.isNativePlatform()) {
        await FirebaseMessaging.unsubscribeFromTopic({ topic });
        console.log(`Desuscrito de ${topic} (nativo)`);
        return true;
      } else {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');

        const db = getFirestore();
        await setDoc(doc(db, 'users', user.uid), {
          [`topics.${topic}`]: false
        }, { merge: true });

        console.log(`Desuscrito de ${topic} (web)`);
        return true;
      }
    } catch (error) {
      console.error('Error desuscribiéndose de tema:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();