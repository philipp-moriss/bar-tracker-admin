import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/core/components/ui/button'
import { Card } from '@/core/components/ui/card'
import { Badge } from '@/core/components/ui/badge'
import { X, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { imageService, ImageUploadResult } from '@/core/services/imageService'
import { cn } from '@/core/lib/utils'

interface ImageUploadProps {
    onImagesChange: (images: ImageUploadResult[]) => void
    maxImages?: number
    folder?: string
    className?: string
    disabled?: boolean
    existingImages?: ImageUploadResult[]
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    onImagesChange,
    maxImages = 5,
    folder = 'images',
    className,
    disabled = false,
    existingImages = []
}) => {
    const [images, setImages] = useState<ImageUploadResult[]>(existingImages)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return

        const fileArray = Array.from(files)
        const remainingSlots = maxImages - images.length

        if (fileArray.length > remainingSlots) {
            setError(`Can upload maximum ${remainingSlots} images`)
            return
        }

        setIsUploading(true)
        setError(null)

        try {
            const uploadResults = await imageService.uploadMultipleImages(fileArray, folder)
            const newImages = [...images, ...uploadResults]
            setImages(newImages)
            onImagesChange(newImages)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error uploading images')
        } finally {
            setIsUploading(false)
        }
    }, [images, maxImages, folder, onImagesChange])

    const handleRemoveImage = useCallback(async (index: number) => {
        const imageToRemove = images[index]

        try {
            // Delete from storage only if path is provided
            if (imageToRemove.path) {
                await imageService.deleteImage(imageToRemove.path)
            }

            // Remove from state regardless
            const newImages = images.filter((_, i) => i !== index)
            setImages(newImages)
            onImagesChange(newImages)
        } catch (err) {
            setError('Error deleting image')
        }
    }, [images, onImagesChange])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        if (disabled) return

        const files = e.dataTransfer.files
        handleFileSelect(files)
    }, [disabled, handleFileSelect])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
    }, [])

    const handleClick = useCallback(() => {
        if (disabled || isUploading) return
        fileInputRef.current?.click()
    }, [disabled, isUploading])

    const canAddMore = images.length < maxImages

    return (
        <div className={cn('space-y-4', className)}>
            {/* Upload Area */}
            {canAddMore && (
                <Card
                    className={cn(
                        'border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer transition-colors',
                        disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400',
                        error && 'border-red-300'
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={handleClick}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                        disabled={disabled || isUploading}
                    />

                    <div className="flex flex-col items-center space-y-2">
                        {isUploading ? (
                            <>
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <p className="text-sm text-gray-600">Uploading...</p>
                            </>
                        ) : (
                            <>
                                <Upload className="h-8 w-8 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        Click or drag images
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        PNG, JPG, WebP, GIF up to 5MB
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </Card>
            )}

            {/* Error Message */}
            {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            )}

            {/* Images Grid */}
            {images.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                            Uploaded images ({images.length}/{maxImages})
                        </h4>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((image, index) => (
                            <div key={index} className="relative group">
                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                        src={image.url}
                                        alt={image.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Remove Button */}
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleRemoveImage(index)}
                                    disabled={disabled}
                                >
                                    <X className="h-3 w-3" />
                                </Button>

                                {/* Image Info */}
                                <div className="mt-1 space-y-1">
                                    <p className="text-xs text-gray-600 truncate" title={image.name}>
                                        {image.name}
                                    </p>
                                    <Badge variant="secondary" className="text-xs">
                                        {imageService.formatFileSize(image.size)}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {images.length === 0 && !canAddMore && (
                <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Maximum number of images reached</p>
                </div>
            )}
        </div>
    )
}
