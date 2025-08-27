import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface UseImageUploadReturn {
  uploadedImageId: Id<"_storage"> | null;
  uploadProgress: number;
  isUploading: boolean;
  error: string | null;
  uploadImage: (file: File) => Promise<void>;
  clearImage: () => void;
  clearError: () => void;
}

// Compress image before upload
const compressImage = (
  file: File,
  maxWidth = 1200,
  quality = 0.8
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback to original if compression fails
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => resolve(file); // Fallback to original if loading fails
    img.src = URL.createObjectURL(file);
  });
};

export const useImageUpload = (teamId: Id<"teams">): UseImageUploadReturn => {
  const [uploadedImageId, setUploadedImageId] = useState<Id<"_storage"> | null>(
    null
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.events.generateEventImageUploadUrl);

  const uploadImage = useCallback(
    async (file: File) => {
      if (!teamId) {
        setError("Team ID is required for image upload");
        return;
      }

      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      try {
        // Validate file
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

        if (file.size > maxSize) {
          throw new Error("Image size must be less than 10MB");
        }

        if (!allowedTypes.includes(file.type)) {
          throw new Error("Image must be JPEG, PNG, or WebP format");
        }

        setUploadProgress(10);

        // Compress image
        const compressedFile = await compressImage(file);
        setUploadProgress(25);

        // Generate signed upload URL from Convex
        const uploadUrl = await generateUploadUrl({ teamId });
        setUploadProgress(40);

        // Create XMLHttpRequest to track upload progress
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 60 + 40; // 40-100%
            setUploadProgress(Math.round(percentComplete));
          }
        });

        // Handle upload completion
        const uploadPromise = new Promise<Id<"_storage">>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText);
                if (response.storageId) {
                  resolve(response.storageId as Id<"_storage">);
                } else {
                  reject(new Error("No storage ID received from server"));
                }
              } catch (e) {
                reject(new Error("Invalid response from server"));
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () =>
            reject(new Error("Upload failed due to network error"));
        });

        // Start upload
        xhr.open("POST", uploadUrl);
        xhr.setRequestHeader("Content-Type", compressedFile.type);
        xhr.send(compressedFile);

        // Wait for upload to complete
        const storageId = await uploadPromise;
        setUploadedImageId(storageId);
        setUploadProgress(100);
        toast.success("Image uploaded successfully!", {
          description: "Your event image is ready to use.",
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Upload failed";
        setError(errorMessage);
        setUploadProgress(0);
        toast.error("Image upload failed", {
          description: errorMessage,
        });
      } finally {
        setIsUploading(false);
      }
    },
    [teamId, generateUploadUrl]
  );

  const clearImage = useCallback(() => {
    setUploadedImageId(null);
    setUploadProgress(0);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    uploadedImageId,
    uploadProgress,
    isUploading,
    error,
    uploadImage,
    clearImage,
    clearError,
  };
};
