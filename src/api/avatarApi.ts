import storageHttp from './storageHttp'

export interface AvatarMetadata {
  hasAvatar: boolean
  version: number
  contentType: string | null
  size: number
  updatedAt: string | null
}

export const avatarApi = {
  async getMetadata(): Promise<AvatarMetadata> {
    const response = await storageHttp.get<AvatarMetadata>('/api/v1/avatars/me')
    return response.data
  },

  async getContent(): Promise<Blob> {
    const response = await storageHttp.get<Blob>(`/api/v1/avatars/me/content?t=${Date.now()}`, {
      responseType: 'blob',
    })
    return response.data
  },

  async replace(file: File): Promise<AvatarMetadata> {
    const body = new FormData()
    body.append('file', file)
    const response = await storageHttp.put<AvatarMetadata>('/api/v1/avatars/me', body)
    return response.data
  },

  async remove(): Promise<void> {
    await storageHttp.delete('/api/v1/avatars/me')
  },
}
