import React, { useCallback } from 'react';
import { useLightbox, useLightboxControls } from '../../contexts/LightboxContext';
import FullScreenImageViewer from './FullScreenImageViewer';

export function Lightbox() {
  const { activeLightbox } = useLightbox();
  const { closeLightbox } = useLightboxControls();

  const onClose = useCallback(() => {
    closeLightbox();
  }, [closeLightbox]);

  if (!activeLightbox) {
    return null;
  }

  // Convert ImageSource[] to string[] for backward compatibility
  const images = activeLightbox.images.map((img) => img.uri);

  return (
    <FullScreenImageViewer
      visible={!!activeLightbox}
      images={images}
      initialIndex={activeLightbox.index}
      onClose={onClose}
      imageSources={activeLightbox.images} // Pass ImageSource[] for animation
    />
  );
}

