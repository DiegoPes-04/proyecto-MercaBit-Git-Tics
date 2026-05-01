// src/services/authService.js
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail
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
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Verificar rol en Firestore para saber si es admin
    const userSnap = await getDoc(doc(db, "users", user.uid));
    console.log("🔍 UID:", user.uid);
    console.log("🔍 Firestore data:", userSnap.data());
    const rol = userSnap.data()?.rol || "usuario";
    console.log("🔍 Rol detectado:", rol);
    const isAdmin = rol === "admin";

    // Admins no necesitan verificar email
    if (!user.emailVerified && !isAdmin) {
      return {
        success: false,
        resend: true,
        message: "Tu correo no está verificado. Por favor revisa tu bandeja de entrada.",
      };
    }

    // Guardar rol en localStorage para acceso rápido
    localStorage.setItem('userRol', rol);
    localStorage.setItem('userUid', user.uid);
    return { success: true, user, rol };
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