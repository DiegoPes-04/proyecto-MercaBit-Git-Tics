
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/FirebaseConfig'

/**
 * Agrega una calificación al vendedor
 * @param {string} vendedorId - UID del vendedor
 * @param {string} compradorId - UID del comprador
 * @param {number} puntaje - 1 a 5
 * @param {string} comentario - texto del comentario
 * @param {string} compraId - ID de la compra (para evitar duplicados)
 */
export const agregarCalificacion = async (
  vendedorId,
  compradorId,
  puntaje,
  comentario,
  compraId = null
) => {
  if (!vendedorId) throw new Error('vendedorId es requerido')
  if (!compradorId) throw new Error('compradorId es requerido')
  if (puntaje < 1 || puntaje > 5) throw new Error('Puntaje debe ser entre 1 y 5')

  const calificacionesRef = collection(db, 'usuarios', vendedorId, 'calificaciones')

  await addDoc(calificacionesRef, {
    compradorId,
    puntaje,
    comentario: comentario || '',
    compraId: compraId || null,
    fecha: Timestamp.now()
  })
}