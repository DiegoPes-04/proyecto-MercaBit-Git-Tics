
import { collection, addDoc, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/FirebaseConfig'

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

  const calRef = collection(db, 'users', vendedorId, 'calificaciones')

  await addDoc(calRef, {
    compradorId,
    puntaje,
    comentario: comentario || '',
    compraId: compraId || null,
    fecha: Timestamp.now()
  })

  // Recalcular promedio y guardarlo en el documento del usuario
  const snap = await getDocs(calRef)
  const puntajes = snap.docs.map(d => d.data().puntaje || 0)
  const promedio = puntajes.length
    ? puntajes.reduce((a, b) => a + b, 0) / puntajes.length
    : 0

  await updateDoc(doc(db, 'users', vendedorId), {
    promedio: Math.round(promedio * 10) / 10,
    totalCalificaciones: puntajes.length
  })
}
