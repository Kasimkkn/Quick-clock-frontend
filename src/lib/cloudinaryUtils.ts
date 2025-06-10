export const uploadToCloudinary = async (file: File) => {
  const CLOUDINARY_UPLOAD_PRESET = 'quick-clock';
  const CLOUDINARY_CLOUD_NAME = 'dwwa4xh6z';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.secure_url; // or return full `data` if needed
};

export const getFileTypeIcon = (fileType: string): string => {
  if (fileType.startsWith('image/')) {
    return 'image';
  } else if (fileType.startsWith('video/')) {
    return 'video';
  } else if (fileType.includes('pdf')) {
    return 'pdf';
  } else if (fileType.includes('doc') || fileType.includes('word')) {
    return 'doc';
  } else if (fileType.includes('xls') || fileType.includes('excel')) {
    return 'xls';
  } else if (fileType.includes('ppt') || fileType.includes('presentation')) {
    return 'ppt';
  }
  return 'file';
};

export const formatFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  } else if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};
