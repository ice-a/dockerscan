import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DockerService } from '@/config/dockerServices'
import { dockerServices as initialServices } from '@/config/dockerServices'

export const useDockerStore = defineStore('docker', () => {
  const services = ref<DockerService[]>([...initialServices])
  const isChecking = ref(false)
  const lastCheckTime = ref<Date | null>(null)
  const checkInterval = ref<number | null>(null)
  const autoCheckInterval = ref(300000) // 5 minutes default

  // Computed properties
  const availableServices = computed(() =>
    services.value.filter(service => service.status === 'available')
      .sort((a, b) => (a.responseTime || Infinity) - (b.responseTime || Infinity))
  )

  const unavailableServices = computed(() =>
    services.value.filter(service => service.status === 'unavailable')
  )

  const checkingServices = computed(() =>
    services.value.filter(service => service.status === 'checking')
  )

  // Check single service availability
  async function checkService(service: DockerService): Promise<void> {
    const startTime = Date.now()
    service.status = 'checking'

    try {
      // Create a unique URL to avoid caching
      const testUrl = `${service.url}/v2/`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      await fetch(testUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
        cache: 'no-cache'
      })

      clearTimeout(timeoutId)

      const responseTime = Date.now() - startTime
      service.status = 'available'
      service.responseTime = responseTime
      service.lastChecked = new Date()
    } catch {
      service.status = 'unavailable'
      service.responseTime = undefined
      service.lastChecked = new Date()
    }
  }

  // Check all services
  async function checkAllServices(): Promise<void> {
    if (isChecking.value) return

    isChecking.value = true
    try {
      // Check services in batches to avoid overwhelming
      const batchSize = 5
      for (let i = 0; i < services.value.length; i += batchSize) {
        const batch = services.value.slice(i, i + batchSize)
        await Promise.all(batch.map(checkService))
      }
      lastCheckTime.value = new Date()
    } finally {
      isChecking.value = false
    }
  }

  // Start auto-check
  function startAutoCheck(intervalMs?: number): void {
    stopAutoCheck()
    if (intervalMs) {
      autoCheckInterval.value = intervalMs
    }
    checkInterval.value = setInterval(() => {
      checkAllServices()
    }, autoCheckInterval.value)
  }

  // Stop auto-check
  function stopAutoCheck(): void {
    if (checkInterval.value) {
      clearInterval(checkInterval.value)
      checkInterval.value = null
    }
  }

  // Reset all services status
  function resetServices(): void {
    services.value.forEach(service => {
      service.status = undefined
      service.responseTime = undefined
      service.lastChecked = undefined
    })
  }

  return {
    services,
    isChecking,
    lastCheckTime,
    checkInterval,
    autoCheckInterval,
    availableServices,
    unavailableServices,
    checkingServices,
    checkService,
    checkAllServices,
    startAutoCheck,
    stopAutoCheck,
    resetServices
  }
})
