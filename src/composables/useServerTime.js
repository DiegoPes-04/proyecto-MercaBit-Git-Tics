import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { db } from '@/firebase/FirebaseConfig'

let _offset = 0
let _calculated = false

export const syncServerTime = async () => {
  if (_calculated) return
  try {
    const uid = getAuth().currentUser?.uid
    if (!uid) return
    const userRef = doc(db, 'users', uid)
    await updateDoc(userRef, { _ts: serverTimestamp() })
    const snap = await getDoc(userRef)
    const serverMs = snap.data()._ts.toDate().getTime()
    _offset = Date.now() - serverMs
    _calculated = true
  } catch (e) {
    console.warn('No se pudo sincronizar tiempo del servidor:', e)
  }
}

export const serverNow = () => Date.now() - _offset
