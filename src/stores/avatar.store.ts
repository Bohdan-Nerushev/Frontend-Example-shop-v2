import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { avatarApi, type AvatarMetadata } from '../api/avatarApi'

export const useAvatarStore = defineStore('avatar', () => {
  const avatarUrl = ref<string | null>(null)
  const metadata = ref<AvatarMetadata | null>(null)
  const loading = ref(false)
  const uploading = ref(false)
  const deleting = ref(false)

  const hasAvatar = computed(() => metadata.value?.hasAvatar === true && avatarUrl.value !== null)

  const replaceObjectUrl = (blob: Blob) => {
    const nextUrl = URL.createObjectURL(blob)
    if (avatarUrl.value) {
      URL.revokeObjectURL(avatarUrl.value)
    }
    avatarUrl.value = nextUrl
  }

  const clearAvatar = () => {
    if (avatarUrl.value) {
      URL.revokeObjectURL(avatarUrl.value)
    }
    avatarUrl.value = null
    metadata.value = null
  }

  const loadAvatar = async () => {
    loading.value = true
    try {
      const nextMetadata = await avatarApi.getMetadata()
      if (!nextMetadata.hasAvatar) {
        clearAvatar()
        return
      }
      const content = await avatarApi.getContent()
      replaceObjectUrl(content)
      metadata.value = nextMetadata
    } finally {
      loading.value = false
    }
  }

  const uploadAvatar = async (file: File) => {
    uploading.value = true
    try {
      metadata.value = await avatarApi.replace(file)
      const content = await avatarApi.getContent()
      replaceObjectUrl(content)
    } finally {
      uploading.value = false
    }
  }

  const deleteAvatar = async () => {
    deleting.value = true
    try {
      await avatarApi.remove()
      clearAvatar()
    } finally {
      deleting.value = false
    }
  }

  return {
    avatarUrl,
    metadata,
    hasAvatar,
    loading,
    uploading,
    deleting,
    loadAvatar,
    uploadAvatar,
    deleteAvatar,
    clearAvatar,
  }
})
