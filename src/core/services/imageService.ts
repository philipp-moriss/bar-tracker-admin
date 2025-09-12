import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    getMetadata,
    updateMetadata
} from 'firebase/storage'
import { storage } from '@/modules/firebase/config'

export interface ImageUploadResult {
    url: string
    path: string
    name: string
    size: number
}

export interface ImageMetadata {
    name: string
    size: number
    contentType: string
    timeCreated: string
    updated: string
}

export class ImageService {
    private readonly maxFileSize = 5 * 1024 * 1024 // 5MB
    private readonly allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

    /**
     * Validate file before upload
     */
    private validateFile(file: File): { valid: boolean; error?: string } {
        if (!this.allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: 'Unsupported file format. Allowed: JPEG, PNG, WebP, GIF'
            }
        }

        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                error: `File too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`
            }
        }

        return { valid: true }
    }

    /**
     * Generate unique filename
     */
    private generateFileName(originalName: string, folder: string): string {
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        const extension = originalName.split('.').pop()
        return `${folder}/${timestamp}_${randomString}.${extension}`
    }

    /**
     * Upload image to Firebase Storage
     */
    async uploadImage(
        file: File,
        folder: string = 'images',
        onProgress?: (progress: number) => void
    ): Promise<ImageUploadResult> {
        try {
            // Validate file
            const validation = this.validateFile(file)
            if (!validation.valid) {
                throw new Error(validation.error)
            }

            // Generate unique filename
            const fileName = this.generateFileName(file.name, folder)
            const storageRef = ref(storage, fileName)

            // Upload file
            const snapshot = await uploadBytes(storageRef, file)

            // Get download URL
            const downloadURL = await getDownloadURL(snapshot.ref)

            // Get metadata
            const metadata = await getMetadata(snapshot.ref)

            return {
                url: downloadURL,
                path: fileName,
                name: file.name,
                size: file.size
            }
        } catch (error) {
            console.error('Error uploading image:', error)
            throw new Error('Error uploading image')
        }
    }

    /**
     * Upload multiple images
     */
    async uploadMultipleImages(
        files: File[],
        folder: string = 'images',
        onProgress?: (progress: number) => void
    ): Promise<ImageUploadResult[]> {
        try {
            const uploadPromises = files.map(file => this.uploadImage(file, folder, onProgress))
            return await Promise.all(uploadPromises)
        } catch (error) {
            console.error('Error uploading multiple images:', error)
            throw new Error('Error uploading images')
        }
    }

    /**
     * Delete image from Firebase Storage
     */
    async deleteImage(imagePath: string): Promise<void> {
        try {
            const imageRef = ref(storage, imagePath)
            await deleteObject(imageRef)
        } catch (error) {
            console.error('Error deleting image:', error)
            throw new Error('Error deleting image')
        }
    }

    /**
     * Delete multiple images
     */
    async deleteMultipleImages(imagePaths: string[]): Promise<void> {
        try {
            const deletePromises = imagePaths.map(path => this.deleteImage(path))
            await Promise.all(deletePromises)
        } catch (error) {
            console.error('Error deleting multiple images:', error)
            throw new Error('Error deleting images')
        }
    }

    /**
     * Get image metadata
     */
    async getImageMetadata(imagePath: string): Promise<ImageMetadata | null> {
        try {
            const imageRef = ref(storage, imagePath)
            const metadata = await getMetadata(imageRef)

            return {
                name: metadata.name,
                size: metadata.size,
                contentType: metadata.contentType,
                timeCreated: metadata.timeCreated,
                updated: metadata.updated
            }
        } catch (error) {
            console.error('Error getting image metadata:', error)
            return null
        }
    }

    /**
     * Update image metadata
     */
    async updateImageMetadata(
        imagePath: string,
        customMetadata: Record<string, string>
    ): Promise<void> {
        try {
            const imageRef = ref(storage, imagePath)
            await updateMetadata(imageRef, {
                customMetadata
            })
        } catch (error) {
            console.error('Error updating image metadata:', error)
            throw new Error('Error updating image metadata')
        }
    }

    /**
     * Get optimized image URL with resize parameters
     */
    getOptimizedImageUrl(imageUrl: string, width?: number, height?: number): string {
        // For now, return original URL
        // In production, you might want to use Firebase Storage resizing or a CDN
        return imageUrl
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes'

        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
}

export const imageService = new ImageService()
