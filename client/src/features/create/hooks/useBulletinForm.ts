import { useState, useRef, useEffect } from 'react';
import type { AudienceScope, Department, CreatePostPayload, Employee, Post } from '@/types/bulletin';
import { bulletinService } from '@/services/bulletinService';
import { compressImageFile } from '@/utils/imageCompressor';
import { DEFAULT_DEPARTMENT_ID, SESB_LOCATIONS } from '@/constants/bulletin';
import type { AttachedPhoto } from '../components/AttachmentTray';

export const MAX_BULLETIN_PHOTOS = 10;

export function useBulletinForm({
  departments,
  currentUser,
  initialPost,
  isEditMode = false,
  onSubmit,
  onUpdate,
  onClose,
}: {
  departments: Department[];
  currentUser: Employee;
  initialPost?: Post | null;
  isEditMode?: boolean;
  onSubmit: (newPostData: CreatePostPayload) => void;
  onUpdate?: (postId: string, updatedData: Partial<Post>) => void;
  onClose: () => void;
}) {
  const activeUser = currentUser;

  const [title, setTitle] = useState(initialPost?.title || '');
  const [content, setContent] = useState(initialPost?.content || '');
  const [selectedDeptId, setSelectedDeptId] = useState(
    initialPost?.departmentId || activeUser.adminDepartments?.[0] || DEFAULT_DEPARTMENT_ID
  );
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [audienceScope, setAudienceScope] = useState<AudienceScope>(
    initialPost?.audienceScope || 'All Sabah Staff'
  );
  const [isAudienceOpen, setIsAudienceOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(
    initialPost?.location || activeUser.officeLocation || SESB_LOCATIONS[0]
  );
  const [isPinned, setIsPinned] = useState(Boolean(initialPost?.isPinned));
  const [isOfficialNotice, setIsOfficialNotice] = useState(Boolean(initialPost?.officialNotice));
  const [allowComments, setAllowComments] = useState(initialPost ? initialPost.commentsEnabled : true);
  const [validationError, setValidationError] = useState('');

  // Attachments State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<AttachedPhoto[]>(() => {
    if (!initialPost) return [];
    const media = initialPost.mediaUrls || (initialPost.imageUrl ? [initialPost.imageUrl] : []);
    return media.map((url, idx) => ({
      id: `existing-photo-${idx}`,
      url,
      name: `Photo ${idx + 1}`,
    }));
  });
  const [isCompressing, setIsCompressing] = useState(false);

  // Photo crop state
  const [isCropProcessing, setIsCropProcessing] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<AttachedPhoto | null>(null);

  // PDF Document State
  const pdfFileInputRef = useRef<HTMLInputElement>(null);
  const [pdfFile, setPdfFile] = useState<{ name: string; size: string; url: string } | null>(() => {
    if (initialPost?.pdfUrl) {
      return {
        name: initialPost.pdfName || 'Document.pdf',
        size: initialPost.pdfSize || 'Verified PDF',
        url: initialPost.pdfUrl,
      };
    }
    return null;
  });

  // Poll Builder State
  const [hasPoll, setHasPoll] = useState(Boolean(initialPost?.poll));
  const [pollQuestion, setPollQuestion] = useState(initialPost?.poll?.question || '');
  const [pollOptions, setPollOptions] = useState<string[]>(
    initialPost?.poll?.options ? initialPost.poll.options.map((o) => o.text) : ['', '']
  );

  const currentDept = departments.find((d) => d.id === selectedDeptId) || departments[0];

  const photosRef = useRef<AttachedPhoto[]>(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => {
        if (p.url.startsWith('blob:')) {
          URL.revokeObjectURL(p.url);
        }
      });
    };
  }, []);

  const handleContentChange = (val: string) => {
    setContent(val);
    if (validationError) setValidationError('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const incomingFiles = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'));
    e.target.value = '';

    if (incomingFiles.length === 0) return;

    const remainingSlots = MAX_BULLETIN_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      setValidationError(`Maximum limit of ${MAX_BULLETIN_PHOTOS} photos reached.`);
      return;
    }

    const filesToProcess = incomingFiles.slice(0, remainingSlots);
    if (incomingFiles.length > remainingSlots) {
      setValidationError(`Only the first ${remainingSlots} photo(s) were added (max ${MAX_BULLETIN_PHOTOS}).`);
    }

    setIsCompressing(true);
    try {
      const processedPhotos = await Promise.all(
        filesToProcess.map(async (file) => {
          try {
            const compressed = await compressImageFile(file, {
              maxWidth: 1600,
              maxHeight: 1600,
              quality: 0.85,
            });
            const localUrl = URL.createObjectURL(compressed.file);
            return {
              id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              url: localUrl,
              name: file.name,
              file: compressed.file,
            };
          } catch {
            const localUrl = URL.createObjectURL(file);
            return {
              id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              url: localUrl,
              name: file.name,
              file,
            };
          }
        })
      );
      setPhotos((prev) => [...prev, ...processedPhotos]);
    } catch (err) {
      console.error('[useBulletinForm] Image processing failed:', err);
      setValidationError('Failed to process photos. Please try again.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleCropComplete = async (croppedFile: File) => {
    if (!editingPhoto) return;
    setIsCropProcessing(true);
    try {
      const newUrl = URL.createObjectURL(croppedFile);
      if (editingPhoto.url.startsWith('blob:')) {
        URL.revokeObjectURL(editingPhoto.url);
      }
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === editingPhoto.id
            ? { ...p, url: newUrl, file: croppedFile, name: croppedFile.name || p.name }
            : p
        )
      );
      setEditingPhoto(null);
    } catch (err) {
      console.error('[useBulletinForm] Photo re-crop failed:', err);
      setValidationError('Failed to update cropped photo.');
    } finally {
      setIsCropProcessing(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    e.target.value = '';

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setValidationError('Only PDF documents are supported for circular attachments.');
      return;
    }

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > 25) {
      setValidationError('PDF file size exceeds the 25MB corporate limit.');
      return;
    }

    const sizeStr = sizeMb < 1 ? `${Math.round(file.size / 1024)} KB` : `${sizeMb.toFixed(1)} MB`;

    setIsCompressing(true);
    let pdfUrl = '';
    try {
      pdfUrl = await bulletinService.uploadPhoto(file);
    } catch (err) {
      console.error('[useBulletinForm] PDF upload failed:', err);
      setValidationError('Failed to upload PDF. Please check your connection.');
      return;
    } finally {
      setIsCompressing(false);
    }

    setPdfFile({
      name: file.name,
      size: `${sizeStr} • Verified`,
      url: pdfUrl,
    });
  };

  const handleAddOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions((prev) => [...prev, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    setPollOptions((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.url.startsWith('blob:')) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!title.trim()) {
      setValidationError('Please enter a title for the bulletin.');
      return;
    }
    if (!content.trim()) {
      setValidationError('Please enter your bulletin content.');
      return;
    }

    if (hasPoll) {
      const validOptions = pollOptions.filter((o) => o.trim().length > 0);
      if (validOptions.length < 2) {
        setValidationError('Please provide at least 2 options for the poll.');
        return;
      }
    }

    setIsCompressing(true);
    try {
      // Upload any local photos in parallel using Promise.all
      const uploadedMediaUrls = (
        await Promise.all(
          photos.map(async (photo) => {
            if (photo.file && (!photo.url || photo.url.startsWith('blob:') || photo.url.startsWith('data:'))) {
              return bulletinService.uploadPhoto(photo.file);
            }
            if (photo.url && !photo.url.startsWith('blob:') && !photo.url.startsWith('data:')) {
              return photo.url;
            }
            return null;
          })
        )
      ).filter((url): url is string => Boolean(url));

      const validPollOptions = pollOptions.filter((o) => o.trim().length > 0);
      const pollData =
        hasPoll && validPollOptions.length >= 2
          ? {
              id: initialPost?.poll?.id || `poll-${Date.now()}`,
              question: pollQuestion.trim() || title.trim() || 'Staff Feedback Poll',
              options: validPollOptions.map((opt, idx) => ({
                id: initialPost?.poll?.options?.[idx]?.id || `opt-${idx + 1}`,
                text: opt.trim(),
                votes: initialPost?.poll?.options?.[idx]?.votes || 0,
              })),
              totalVotes: initialPost?.poll?.totalVotes || 0,
            }
          : undefined;

      if (isEditMode && initialPost && onUpdate) {
        await onUpdate(initialPost.id, {
          title: title.trim(),
          content: content.trim(),
          location: selectedLocation,
          isPinned: isPinned,
          officialNotice: isOfficialNotice,
          audienceScope,
          departmentId: currentDept.id,
          departmentName: currentDept.name,
          departmentColor: currentDept.color || '#0055A4',
          mediaUrls: uploadedMediaUrls.length > 0 ? uploadedMediaUrls : [],
          imageUrl: uploadedMediaUrls.length > 0 ? uploadedMediaUrls[0] : null,
          commentsEnabled: allowComments,
          poll: pollData,
          pdfUrl: pdfFile?.url,
          pdfName: pdfFile?.name,
          pdfSize: pdfFile?.size,
          isEdited: true,
          editedAt: new Date().toISOString(),
        });
        onClose();
        return;
      }

      const newPost: CreatePostPayload = {
        title: title.trim() || 'SE-Connect',
        content: content.trim(),
        authorName: activeUser.name,
        department: currentDept.name,
        departmentId: currentDept.id,
        departmentColor: currentDept.color || '#0055A4',
        avatarUrl: activeUser.avatarUrl,
        location: selectedLocation,
        isPinned: isPinned,
        mediaUrls: uploadedMediaUrls.length > 0 ? uploadedMediaUrls : undefined,
        imageUrl: uploadedMediaUrls.length > 0 ? uploadedMediaUrls[0] : undefined,
        officialNotice: isOfficialNotice,
        audienceScope,
        commentsEnabled: allowComments,
        pdfUrl: pdfFile?.url,
        pdfName: pdfFile?.name,
        pdfSize: pdfFile?.size,
        poll: pollData,
      };

      onSubmit(newPost);
    } catch (publishErr) {
      console.error('[useBulletinForm] Publish failed:', publishErr);
      setValidationError('Failed to upload photos or publish bulletin. Please check your connection.');
    } finally {
      setIsCompressing(false);
    }
  };

  return {
    activeUser,
    title,
    setTitle,
    content,
    handleContentChange,
    selectedDeptId,
    setSelectedDeptId,
    isDeptOpen,
    setIsDeptOpen,
    audienceScope,
    setAudienceScope,
    isAudienceOpen,
    setIsAudienceOpen,
    selectedLocation,
    setSelectedLocation,
    isPinned,
    setIsPinned,
    isOfficialNotice,
    setIsOfficialNotice,
    allowComments,
    setAllowComments,
    validationError,
    setValidationError,
    photos,
    fileInputRef,
    triggerPhotoUpload: () => fileInputRef.current?.click(),
    handleFileUpload,
    handleRemovePhoto,
    isCompressing,
    isCropProcessing,
    editingPhoto,
    setEditingPhoto,
    handleCropComplete,
    pdfFileInputRef,
    triggerPdfUpload: () => pdfFileInputRef.current?.click(),
    pdfFile,
    setPdfFile,
    handlePdfUpload,
    hasPoll,
    setHasPoll,
    pollQuestion,
    setPollQuestion,
    pollOptions,
    handleAddOption,
    handleRemoveOption,
    handleOptionChange,
    currentDept,
    handleSubmit,
  };
}
