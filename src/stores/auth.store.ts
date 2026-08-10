import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import keycloak from '../auth/keycloak'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const username = ref<string | null>(null)
  const email = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  const login = () => {
    keycloak.login()
  }

  const logout = () => {
    clearAuth()
    keycloak.logout({
      redirectUri: window.location.origin,
    })
  }

  const setToken = (accessToken: string, refToken: string) => {
    token.value = accessToken
    refreshToken.value = refToken

    try {
      const parts = accessToken.split('.')
      const payloadBase64 = parts[1]
      if (payloadBase64) {
        const decodedPayload = JSON.parse(atob(payloadBase64))
        username.value = decodedPayload.preferred_username || null
        email.value = decodedPayload.email || null
      }
    } catch (e) {
      console.error('Failed to parse access token payload', e)
    }
  }

  const clearAuth = () => {
    token.value = null
    refreshToken.value = null
    username.value = null
    email.value = null
  }

  const initAuth = (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.warn('Keycloak initialization timed out (3s). Proceeding in offline mode.')
        resolve(false)
      }, 3000)

      keycloak
        .init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
          pkceMethod: 'S256',
        })
        .then((authenticated) => {
          clearTimeout(timeout)
          if (authenticated && keycloak.token && keycloak.refreshToken) {
            setToken(keycloak.token, keycloak.refreshToken)
          }
          resolve(authenticated)
        })
        .catch((error) => {
          clearTimeout(timeout)
          console.error('Keycloak initialization failed', error)
          reject(error)
        })
    })
  }

  const updateToken = (minValiditySeconds: number = 30): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      keycloak
        .updateToken(minValiditySeconds)
        .then((refreshed) => {
          if (refreshed && keycloak.token && keycloak.refreshToken) {
            setToken(keycloak.token, keycloak.refreshToken)
          }
          resolve(refreshed)
        })
        .catch((error) => {
          console.error('Failed to refresh token', error)
          clearAuth()
          reject(error)
        })
    })
  }

  return {
    token,
    refreshToken,
    username,
    email,
    isAuthenticated,
    login,
    logout,
    initAuth,
    updateToken,
    clearAuth,
  }
})
