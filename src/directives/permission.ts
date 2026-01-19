import { useUserStore } from '@/store/user'

export default {
  mounted(el: HTMLElement, binding: any) {
    const store = useUserStore()
    const permission = binding.value
    if (!store.permissions.includes(permission)) {
      el.parentNode && el.parentNode.removeChild(el)
    }
  },
}
