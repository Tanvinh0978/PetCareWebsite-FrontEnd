import axiosClient from './axiosClient'

export const mediaService = {
  upload: async (file: File | Blob, folder: string = 'general'): Promise<string> => {
    const formData = new FormData()
    formData.append('File', file)
    formData.append('Folder', folder)

    const res: any = await axiosClient.post('/api/Media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (typeof res === 'string') return res
    if (res?.result) {
      if (typeof res.result === 'string') return res.result
      if (typeof res.result === 'object') {
        return res.result.url || res.result.fileUrl || res.result.imageUrl || res.result.path || ''
      }
    }
    if (res?.url) return res.url
    if (res?.fileUrl) return res.fileUrl
    if (res?.imageUrl) return res.imageUrl
    if (res?.data && typeof res.data === 'string') return res.data
    if (res?.data?.url) return res.data.url

    return ''
  },
}

export default mediaService
