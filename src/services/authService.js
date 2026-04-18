// src/services/authService.js
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp, setLogLevel } from "firebase/firestore";
import { app } from "@/firebase/FirebaseConfig"; // Importa tu configuración de Firebase
// Inicializamos servicios
const auth = getAuth(app);
const db = getFirestore(app);

// ACTIVA LOGS DETALLADOS EN CONSOLA 
setLogLevel("debug");

// Función para registrar un nuevo usuario
export const registerUser = async (name, telefono, email, password) => {
  try {
    if (!name || !telefono || !email || !password) {
      return { success: false, message: "Por favor completa todos los campos" };
    }

    console.log("Datos enviados a Firebase:", { name, telefono, email });

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Esperar a que Firebase lo reconozca como autenticado
    await user.getIdToken(true);
    console.log("Usuario creado con UID:", user.uid);

    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      name: String(name),
      telefono: String(telefono),
      email: String(email),
      saldo: 10000000, // Saldo inicial por defecto
      createdAt: new Date(),
      lastLogin: new Date(),
    });

    // Enviar correo de verificación
    await sendEmailVerification(user);

    return {
      success: true,
      message: "Registro exitoso. Revisa tu correo y verifica tu cuenta antes de iniciar sesión.",
    };

  } catch (error) {
    console.error("🔥 Error en registerUser:", error);
    return { success: false, message: error.message };
  }
};

// Funcion para verificar el correo electrónico y Login
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const isAdmin = email === "admin@mercabit.com"; // <-- Tu correo de administrador

    if (!user.emailVerified && !isAdmin) {
      return {
        success: false,
        resend: true,
        message: "Tu correo no está verificado. Por favor revisa tu bandeja de entrada.",
      };
    }

    return { success: true, user };
  } catch (error) {
    console.error("🔥 Error al iniciar sesión:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

//Funcion para actualizar contraseña
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true, message: "Si existe una cuenta asociada a este correo, recibirás un enlace para restablecer tu contraseña."
    };
  } catch (error) {
    console.error("Error al enviar el correo de recuperación:", error);
    return { success: false, message: error.message };
  }
};

// Función para cerrar sesión
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
