import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import keycloak from '../auth/keycloak'
import axios from 'axios'
import router from '../router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('access_token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'))
  const idToken = ref<string | null>(localStorage.getItem('id_token'))
  const tokenExp = ref<number | null>(null)
  const username = ref<string | null>(null)
  const email = ref<string | null>(null)
  const firstName = ref<string | null>(null)
  const lastName = ref<string | null>(null)

  const parseTokenPayload = (accessToken: string) => {
    try {
      const parts = accessToken.split('.')
      const payloadBase64 = parts[1]
      if (payloadBase64) {
        // Decode base64 URL safe string
        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
        const binString = atob(base64)
        const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0) || 0)
        const decodedPayload = JSON.parse(new TextDecoder().decode(bytes))
        username.value = decodedPayload.preferred_username || null
        email.value = decodedPayload.email || null
        firstName.value = decodedPayload.given_name || null
        lastName.value = decodedPayload.family_name || null
        tokenExp.value = decodedPayload.exp || null
      }
    } catch (e) {
      console.error('Failed to parse access token payload', e)
    }
  }

  // Restore payload on store creation if token exists
  if (token.value) {
    parseTokenPayload(token.value)
  }

  const isAuthenticated = computed(() => !!token.value)

  const login = () => {
    keycloak.login()
  }

  const logout = () => {
    const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || 'https://localhost:8443'
    const realmName = import.meta.env.VITE_KEYCLOAK_REALM || 'mail-and-media-shop-realm'
    const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'mail-and-media-shop-app'
    const redirectUri = window.location.origin + '/'
    const hint = idToken.value
    
    clearAuth()
    
    if (hint) {
      window.location.href = `${keycloakUrl}/realms/${realmName}/protocol/openid-connect/logout?id_token_hint=${encodeURIComponent(hint)}&post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`
    } else {
      window.location.href = `${keycloakUrl}/realms/${realmName}/protocol/openid-connect/logout?client_id=${clientId}&post_logout_redirect_uri=${encodeURIComponent(redirectUri)}&redirect_uri=${encodeURIComponent(redirectUri)}`
    }
  }

  const setToken = (accessToken: string, refToken: string, identityToken?: string) => {
    token.value = accessToken
    refreshToken.value = refToken
    if (identityToken) {
      idToken.value = identityToken
      localStorage.setItem('id_token', identityToken)
    }
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refToken)
    parseTokenPayload(accessToken)
  }

  const clearAuth = () => {
    token.value = null
    refreshToken.value = null
    idToken.value = null
    username.value = null
    email.value = null
    firstName.value = null
    lastName.value = null
    tokenExp.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('id_token')
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
            setToken(keycloak.token, keycloak.refreshToken, keycloak.idToken)
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
    return new Promise(async (resolve, reject) => {
      // 1. Check if token is still valid
      if (token.value && tokenExp.value) {
        const now = Math.floor(Date.now() / 1000)
        const timeRemaining = tokenExp.value - now
        if (timeRemaining > minValiditySeconds) {
          return resolve(false) // Token is still valid, no refresh needed
        }
      }

      // 2. If token is expired or close to expiring, check refresh token
      if (!refreshToken.value) {
        clearAuth()
        return reject(new Error('No refresh token available'))
      }

      // 3. Perform manual refresh via Axios
      const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || 'https://localhost:8443'
      const realmName = import.meta.env.VITE_KEYCLOAK_REALM || 'mail-and-media-shop-realm'
      const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'mail-and-media-shop-app'
      const clientSecret = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || '2BcfsFrhh6WWwMQMhxfyjweZuLdWmfpr'

      const params = new URLSearchParams()
      params.append('grant_type', 'refresh_token')
      params.append('client_id', clientId)
      params.append('refresh_token', refreshToken.value)

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
          setToken(response.data.access_token, response.data.refresh_token, response.data.id_token)
          // Sync with Keycloak JS instance just in case
          keycloak.token = response.data.access_token
          keycloak.refreshToken = response.data.refresh_token
          keycloak.authenticated = true
          return resolve(true)
        }
        throw new Error('Invalid token response from Keycloak during refresh')
      } catch (err: any) {
        console.error('Failed to refresh token', err)
        clearAuth()
        reject(err)
      }
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
        setToken(response.data.access_token, response.data.refresh_token, response.data.id_token)
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

  const loginWithGoogle = () => {
    keycloak.login({ idpHint: 'google', prompt: 'login' })
  }

  return {
    token,
    refreshToken,
    idToken,
    username,
    email,
    firstName,
    lastName,
    isAuthenticated,
    login,
    logout,
    initAuth,
    updateToken,
    clearAuth,
    loginWithCredentials,
    loginWithGoogle,
  }
})
