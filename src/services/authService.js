// src/services/authService.js
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  inMemoryPersistence
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { app } from "@/firebase/FirebaseConfig";

const auth = getAuth(app);
const db = getFirestore(app);

// ── Registrar usuario ─────────────────────────────
export const registerUser = async (name, telefono, email, password) => {
  try {
    if (!name || !telefono || !email || !password) {
      return { success: false, message: "Por favor completa todos los campos" };
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await user.getIdToken(true);

    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      name: String(name),
      telefono: String(telefono),
      email: String(email),
      saldo: 10000000,
      rol: "usuario", // rol por defecto
      createdAt: new Date(),
      lastLogin: new Date(),
    });

    await sendEmailVerification(user);
    await signOut(auth);

    return {
      success: true,
      message: "Registro exitoso. Revisa tu correo y verifica tu cuenta antes de iniciar sesión.",
    };
  } catch (error) {
    console.error("Error en registerUser:", error);
    return { success: false, message: error.message };
  }
};

// ── Login ─────────────────────────────────────────
export const loginUser = async (email, password, rememberMe = false) => {
  try {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : inMemoryPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Forzar refresco del estado del usuario desde el servidor
    await user.reload();
    const freshUser = auth.currentUser;

    // Verificar rol en Firestore
    const userSnap = await getDoc(doc(db, "users", user.uid));
    const rol = userSnap.data()?.rol || "usuario";

    // Bloquear acceso a administradores — deben usar el panel web
    if (rol === "admin" || rol === "superadmin") {
      await signOut(auth);
      return {
        success: false,
        message: "Los administradores no pueden acceder desde la app móvil. Usa el panel web de MercaBit.",
      };
    }

    // Verificar correo para usuarios normales
    if (!freshUser?.emailVerified) {
      await signOut(auth);
      return {
        success: false,
        resend: true,
        message: "Tu correo no está verificado. Por favor revisa tu bandeja de entrada.",
      };
    }

    localStorage.setItem('userUid', user.uid);
    return { success: true, uid: user.uid, rol };
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return { success: false, message: error.message };
  }
};

// ── Reset password ────────────────────────────────
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: "Si existe una cuenta asociada a este correo, recibirás un enlace para restablecer tu contraseña."
    };
  } catch (error) {
    console.error("Error al enviar correo de recuperación:", error);
    return { success: false, message: error.message };
  }
};

// ── Logout ────────────────────────────────────────
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};