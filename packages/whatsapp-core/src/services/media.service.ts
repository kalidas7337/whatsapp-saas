/**
 * Media Service
 *
 * Media upload, download, and management operations
 */

import { WhatsAppCloudApiService } from './cloud-api.service'
import { MediaInfo, UploadMediaResponse } from '../types/api.types'
import { MAX_FILE_SIZES, SUPPORTED_MEDIA_TYPES } from '../constants'
import { WhatsAppValidationError, WhatsAppMediaError } from '../errors/whatsapp-error'

/**
 * Media type classification
 */
export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'STICKER'

/**
 * Uploaded media info with local tracking
 */
export interface UploadedMedia {
  id: string
  type: MediaType
  mimeType: string
  filename?: string
  size?: number
  uploadedAt: Date
}

/**
 * Media Service
 *
 * Handles media operations with validation
 */
export class MediaService {
  private mediaCache: Map<string, MediaInfo> = new Map()
  private readonly cacheTTL: number

  constructor(
    private readonly api: WhatsAppCloudApiService,
    options: { cacheTTL?: number } = {}
  ) {
    // Default 1 hour cache (media URLs expire after some time)
    this.cacheTTL = options.cacheTTL || 60 * 60 * 1000
  }

  /**
   * Upload media file
   */
  async upload(
    file: Buffer | Blob,
    mimeType: string,
    options?: { filename?: string; type?: MediaType }
  ): Promise<UploadedMedia> {
    // Determine media type
    const mediaType = options?.type || this.getMediaType(mimeType)
    if (!mediaType) {
      throw new WhatsAppValidationError(`Unsupported MIME type: ${mimeType}`)
    }

    // Validate MIME type
    const supportedTypes = SUPPORTED_MEDIA_TYPES[mediaType]
    if (!supportedTypes.includes(mimeType)) {
      throw new WhatsAppValidationError(
        `MIME type ${mimeType} is not supported for ${mediaType}. Supported: ${supportedTypes.join(', ')}`
      )
    }

    // Validate file size
    const size = Buffer.isBuffer(file) ? file.length : (file as Blob).size
    const maxSize = MAX_FILE_SIZES[mediaType]
    if (size > maxSize) {
      throw new WhatsAppValidationError(
        `File size ${this.formatBytes(size)} exceeds maximum ${this.formatBytes(maxSize)} for ${mediaType}`
      )
    }

    // Upload
    const response = await this.api.uploadMedia(file, mimeType, options?.filename)

    return {
      id: response.id,
      type: mediaType,
      mimeType,
      filename: options?.filename,
      size,
      uploadedAt: new Date(),
    }
  }

  /**
   * Upload image
   */
  async uploadImage(
    file: Buffer | Blob,
    options?: { filename?: string; mimeType?: string }
  ): Promise<UploadedMedia> {
    const mimeType = options?.mimeType || 'image/jpeg'
    return this.upload(file, mimeType, { ...options, type: 'IMAGE' })
  }

  /**
   * Upload video
   */
  async uploadVideo(
    file: Buffer | Blob,
    options?: { filename?: string; mimeType?: string }
  ): Promise<UploadedMedia> {
    const mimeType = options?.mimeType || 'video/mp4'
    return this.upload(file, mimeType, { ...options, type: 'VIDEO' })
  }

  /**
   * Upload audio
   */
  async uploadAudio(
    file: Buffer | Blob,
    options?: { filename?: string; mimeType?: string }
  ): Promise<UploadedMedia> {
    const mimeType = options?.mimeType || 'audio/mpeg'
    return this.upload(file, mimeType, { ...options, type: 'AUDIO' })
  }

  /**
   * Upload document
   */
  async uploadDocument(
    file: Buffer | Blob,
    filename: string,
    options?: { mimeType?: string }
  ): Promise<UploadedMedia> {
    const mimeType = options?.mimeType || this.guessMimeType(filename) || 'application/octet-stream'
    return this.upload(file, mimeType, { filename, type: 'DOCUMENT' })
  }

  /**
   * Get media URL from ID
   */
  async getUrl(mediaId: string, options?: { forceRefresh?: boolean }): Promise<string> {
    // Check cache
    if (!options?.forceRefresh) {
      const cached = this.mediaCache.get(mediaId)
      if (cached) {
        return cached.url
      }
    }

    // Fetch from API
    const mediaInfo = await this.api.getMediaUrl(mediaId)

    // Cache the result
    this.mediaCache.set(mediaId, mediaInfo)

    // Clear cache after TTL
    setTimeout(() => {
      this.mediaCache.delete(mediaId)
    }, this.cacheTTL)

    return mediaInfo.url
  }

  /**
   * Get full media info
   */
  async getInfo(mediaId: string): Promise<MediaInfo> {
    const cached = this.mediaCache.get(mediaId)
    if (cached) {
      return cached
    }

    const mediaInfo = await this.api.getMediaUrl(mediaId)
    this.mediaCache.set(mediaId, mediaInfo)
    return mediaInfo
  }

  /**
   * Download media to buffer
   */
  async download(mediaId: string): Promise<{
    buffer: Buffer
    mimeType: string
    size: number
  }> {
    const mediaInfo = await this.getInfo(mediaId)
    const buffer = await this.api.downloadMedia(mediaInfo.url)

    return {
      buffer,
      mimeType: mediaInfo.mime_type,
      size: mediaInfo.file_size,
    }
  }

  /**
   * Download media from a webhook message
   */
  async downloadFromMessage(message: {
    id: string
    mime_type: string
  }): Promise<{
    buffer: Buffer
    mimeType: string
    mediaId: string
  }> {
    const { buffer } = await this.download(message.id)
    return {
      buffer,
      mimeType: message.mime_type,
      mediaId: message.id,
    }
  }

  /**
   * Delete uploaded media
   */
  async delete(mediaId: string): Promise<{ success: boolean }> {
    const result = await this.api.deleteMedia(mediaId)
    this.mediaCache.delete(mediaId)
    return result
  }

  /**
   * Clear media cache
   */
  clearCache(): void {
    this.mediaCache.clear()
  }

  /**
   * Validate media before upload
   */
  validateMedia(file: Buffer | Blob, mimeType: string): {
    valid: boolean
    type?: MediaType
    errors: string[]
  } {
    const errors: string[] = []

    // Check MIME type
    const mediaType = this.getMediaType(mimeType)
    if (!mediaType) {
      errors.push(`Unsupported MIME type: ${mimeType}`)
      return { valid: false, errors }
    }

    // Check if MIME type is in supported list
    const supportedTypes = SUPPORTED_MEDIA_TYPES[mediaType]
    if (!supportedTypes.includes(mimeType)) {
      errors.push(`MIME type ${mimeType} not in supported list for ${mediaType}`)
    }

    // Check file size
    const size = Buffer.isBuffer(file) ? file.length : (file as Blob).size
    const maxSize = MAX_FILE_SIZES[mediaType]
    if (size > maxSize) {
      errors.push(`File size ${this.formatBytes(size)} exceeds max ${this.formatBytes(maxSize)}`)
    }

    return {
      valid: errors.length === 0,
      type: mediaType,
      errors,
    }
  }

  /**
   * Get media type from MIME type
   */
  getMediaType(mimeType: string): MediaType | null {
    if (mimeType.startsWith('image/')) {
      return mimeType === 'image/webp' ? 'STICKER' : 'IMAGE'
    }
    if (mimeType.startsWith('video/')) return 'VIDEO'
    if (mimeType.startsWith('audio/')) return 'AUDIO'
    if (
      mimeType.startsWith('application/') ||
      mimeType.startsWith('text/')
    ) {
      return 'DOCUMENT'
    }
    return null
  }

  /**
   * Guess MIME type from filename
   */
  private guessMimeType(filename: string): string | null {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (!ext) return null

    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      mp4: 'video/mp4',
      mp3: 'audio/mpeg',
      ogg: 'audio/ogg',
    }

    return mimeTypes[ext] || null
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
}

export default MediaService
