import { useRef, useState } from 'react';
import type { Employee, ToastMessage } from '@/types/bulletin';
import { bulletinService } from '@/services/bulletinService';
import { AVATAR_OUTPUT_SIZE, validateAvatarFile } from '@/utils/cropImage';

interface UseProfileMediaUploadParams {
  profileData: Employee;
  setProfileData: React.Dispatch<React.SetStateAction<Employee>>;
  isEditModalOpen: boolean;
  setTempAvatarUrl: React.Dispatch<React.SetStateAction<string>>;
  setTempCoverUrl: React.Dispatch<React.SetStateAction<string>>;
  setToast: React.Dispatch<React.SetStateAction<ToastMessage | null>>;
  onUpdateProfile?: (updated: Employee) => void;
}

export function useProfileMediaUpload({
  profileData,
  setProfileData,
  isEditModalOpen,
  setTempAvatarUrl,
  setTempCoverUrl,
  setToast,
  onUpdateProfile,
}: UseProfileMediaUploadParams) {
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const closeAvatarSheet = () => {
    setPendingAvatarFile(null);
    previouslyFocusedRef.current?.focus?.();
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: 'avatar' | 'cover'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    if (mode === 'avatar') {
      const problem = validateAvatarFile(file);
      if (problem) {
        setToast({ message: problem, icon: 'error' });
        return;
      }
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      setPendingAvatarFile(file);
      return;
    }

    try {
      const uploadedUrl = await bulletinService.uploadPhoto(file);
      if (isEditModalOpen) {
        setTempCoverUrl(uploadedUrl);
        setToast({ message: 'Banner uploaded. Save changes to apply.', icon: 'check_circle' });
      } else {
        const updated = { ...profileData, coverUrl: uploadedUrl };
        setProfileData(updated);
        setTempCoverUrl(uploadedUrl);
        onUpdateProfile?.(updated);
      }
    } catch (err) {
      console.error('[useProfileMediaUpload] Upload failed:', err);
      setToast({
        message: 'Failed to upload image. Please check your connection and try again.',
        icon: 'error',
      });
    }
  };

  const handleAvatarConfirm = async (croppedFile: File) => {
    setIsAvatarUploading(true);
    try {
      const uploadedUrl = await bulletinService.uploadPhoto(croppedFile, {
        maxWidth: AVATAR_OUTPUT_SIZE,
        maxHeight: AVATAR_OUTPUT_SIZE,
        quality: 0.86,
      });

      if (isEditModalOpen) {
        setTempAvatarUrl(uploadedUrl);
        setToast({ message: 'Photo cropped. Save changes to apply.', icon: 'check_circle' });
      } else {
        const updated = { ...profileData, avatarUrl: uploadedUrl };
        setProfileData(updated);
        setTempAvatarUrl(uploadedUrl);
        onUpdateProfile?.(updated);
      }
    } catch (err) {
      console.error('[useProfileMediaUpload] Avatar upload failed:', err);
      setToast({
        message: 'Could not save your photo. Please try again.',
        icon: 'error',
      });
    } finally {
      setIsAvatarUploading(false);
      closeAvatarSheet();
    }
  };

  return {
    avatarFileInputRef,
    coverFileInputRef,
    pendingAvatarFile,
    isAvatarUploading,
    closeAvatarSheet,
    handleFileUpload,
    handleAvatarConfirm,
  };
}
