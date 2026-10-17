<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAvatarStore } from '../../stores/avatar.store'
import { useNotification } from '../../composables/useNotification'
import AppModal from './AppModal.vue'
import UserAvatar from './UserAvatar.vue'

const props = withDefaults(
  defineProps<{
    displayName: string | null
    size?: 'small' | 'medium' | 'medium-large' | 'large'
  }>(),
  {
    size: 'small',
  }
)

const avatarStore = useAvatarStore()
const notification = useNotification()
const isOpen = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)

const displayImage = computed(() => previewUrl.value || avatarStore.avatarUrl)
const isBusy = computed(() => avatarStore.loading || avatarStore.uploading || avatarStore.deleting)

const errorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as { response?: { data?: { message?: string } } }
  return axiosError.response?.data?.message || fallback
}

const openMenu = () => {
  isOpen.value = true
}

const clearSelection = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = null
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const selectFile = () => {
  fileInput.value?.click()
}

const onFileSelected = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    notification.error('Choose a JPEG, PNG, or WebP image.')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    notification.error('Image size must not exceed 5 MB.')
    return
  }

  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)

  try {
    await avatarStore.uploadAvatar(file)
    clearSelection()
    notification.success('Profile image updated.')
  } catch (error) {
    notification.error(errorMessage(error, 'Unable to upload the profile image.'))
    clearSelection()
  }
}

const remove = async () => {
  try {
    await avatarStore.deleteAvatar()
    clearSelection()
    notification.success('Profile image deleted.')
  } catch (error) {
    notification.error(errorMessage(error, 'Unable to delete the profile image.'))
  }
}

onMounted(async () => {
  try {
    await avatarStore.loadAvatar()
  } catch (error) {
    notification.error(errorMessage(error, 'Unable to load the profile image.'))
  }
})

onUnmounted(clearSelection)
</script>

<template>
  <button type="button" class="avatar-trigger" title="Manage profile image" @click="openMenu">
    <UserAvatar :image-url="avatarStore.avatarUrl" :display-name="displayName" :size="size" />
  </button>

  <AppModal :open="isOpen" title="Profile image" @close="isOpen = false">
    <div class="avatar-menu">
      <div class="avatar-preview-container" title="Choose new image" @click="selectFile">
        <UserAvatar :image-url="displayImage" :display-name="displayName" size="large" />
        <div class="avatar-overlay">
          <span class="upload-icon">📷</span>
          <span class="upload-text">{{ avatarStore.hasAvatar ? 'Change photo' : 'Upload photo' }}</span>
        </div>
      </div>
      <p v-if="selectedFile" class="selected-file">{{ selectedFile.name }}</p>
      <p v-else class="avatar-hint">JPEG, PNG, or WebP up to 5 MB.</p>
      <input
        ref="fileInput"
        class="file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        @change="onFileSelected"
      />
    </div>
    <template #actions>
      <button type="button" class="btn" :disabled="isBusy" @click="selectFile">
        <span v-if="avatarStore.uploading">Uploading...</span>
        <span v-else>{{ avatarStore.hasAvatar ? 'Change image' : 'Upload image' }}</span>
      </button>
      <button
        v-if="avatarStore.hasAvatar"
        type="button"
        class="btn btn-danger"
        :disabled="isBusy"
        @click="remove"
      >
        {{ avatarStore.deleting ? 'Deleting...' : 'Delete image' }}
      </button>
    </template>
  </AppModal>
</template>

<style scoped>
.avatar-trigger { display: inline-flex; border: 0; padding: 0; background: transparent; cursor: pointer; }
.avatar-menu { display: flex; flex-direction: column; align-items: center; gap: .75rem; }
.avatar-preview-container {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
  display: inline-flex;
}
.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(15, 23, 42, 0.65);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease, backdrop-filter 0.2s ease;
  color: #ffffff;
  border-radius: 50%;
  backdrop-filter: blur(0px);
}
.avatar-preview-container:hover .avatar-overlay {
  opacity: 1;
  backdrop-filter: blur(2px);
}
.upload-icon {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}
.upload-text {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  text-transform: uppercase;
}
.file-input { display: none; }
.avatar-hint, .selected-file { margin: 0; color: var(--color-text-muted); text-align: center; overflow-wrap: anywhere; }
.btn-danger { color: #fff; background: #b91c1c; border-color: #b91c1c; }
.btn-primary { color: #fff; background: var(--color-primary); border-color: var(--color-primary); }
</style>
