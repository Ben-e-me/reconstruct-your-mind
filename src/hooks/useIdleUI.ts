import { useEffect, useRef, useState } from 'react'

export function useIdleUI(timeout = 2000) {
  const [active, setActive] = useState(true)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const wake = () => {
      setActive(true)
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setActive(false), timeout)
    }
    wake()
    window.addEventListener('mousemove', wake)
    window.addEventListener('touchstart', wake)
    return () => {
      window.removeEventListener('mousemove', wake)
      window.removeEventListener('touchstart', wake)
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [timeout])

  return active
}
