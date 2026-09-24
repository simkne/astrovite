export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  const ua = navigator.userAgent || ''
  if (/Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua)) {
    return true
  }

  if (navigator.maxTouchPoints > 1) {
    if (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches) {
      if (typeof window !== 'undefined' && window.innerWidth <= 820) {
        return true
      }
    }
  }

  return false
}
