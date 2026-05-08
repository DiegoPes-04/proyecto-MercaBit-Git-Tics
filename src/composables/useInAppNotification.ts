import { reactive } from 'vue'

interface NotifState {
  visible: boolean
  title: string
  body: string
}

export const state = reactive<NotifState>({
  visible: false,
  title: '',
  body: '',
})

export function triggerNotification(title: string, body: string) {
  state.title = title
  state.body = body
  state.visible = true
}

export function dismissNotification() {
  state.visible = false
}


export function useInAppNotification() {
  return { state, triggerNotification, dismissNotification }
}
