import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import keycloak from '../auth/keycloak'
import axios from 'axios'
import router from '../router'

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
    // Navigate to home via Vue Router instead of calling keycloak.logout().
    // keycloak.logout() causes a full browser page reload via redirect, which
    // also disrupts the registration success screen and other Vue-managed views.
    // Since tokens live only in Pinia memory refs (not persisted), clearing them
    // is sufficient to end the client session for our password-grant flow.
    router.push({ name: 'home' })
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
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('Keycloak initialization timed out (3s). Proceeding in offline mode.')
        resolve(false)
      }, 3000)

      // Use onLoad:'none' to prevent Keycloak from automatically redirecting the browser
      // when it detects a new SSO session (e.g. right after registration).
      // Token management is handled manually via loginWithCredentials.
      // NOTE: omitting onLoad entirely is equivalent to 'none' — Keycloak-JS does not
      // accept 'none' as a valid KeycloakOnLoad type value.
      keycloak
        .init({
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
          // Resolve false instead of rejecting so the app still boots
          resolve(false)
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

  const loginWithCredentials = async (userVal: string, passwordVal: string) => {
    const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || 'https://localhost:8443'
    const realmName = import.meta.env.VITE_KEYCLOAK_REALM || 'mail-and-media-shop-realm'
    const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'mail-and-media-shop-app'
    const clientSecret = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || '2BcfsFrhh6WWwMQMhxfyjweZuLdWmfpr'

    const params = new URLSearchParams()
    params.append('grant_type', 'password')
    params.append('client_id', clientId)
    params.append('client_secret', clientSecret)
    params.append('username', userVal)
    params.append('password', passwordVal)

    try {
      const response = await axios.post(
        `${keycloakUrl}/realms/${realmName}/protocol/openid-connect/token`,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      if (response.data && response.data.access_token && response.data.refresh_token) {
        setToken(response.data.access_token, response.data.refresh_token)
        // Sync tokens with keycloak instance to keep silent refresh working
        keycloak.token = response.data.access_token
        keycloak.refreshToken = response.data.refresh_token
        keycloak.authenticated = true
        return true
      }
      throw new Error('Invalid token response from Keycloak')
    } catch (err: any) {
      console.error('Login credentials request failed', err)
      const errMsg = err.response?.data?.error_description || err.message || 'Login failed'
      throw new Error(errMsg)
    }
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
    loginWithCredentials,
  }
})
