"use client";

import { useState } from "react";
import ImageSequence from "./ImageSequence";
import Lightbox from "@/components/shared/Lightbox";
import type { Project } from "@/types/sanity";

interface ProjectDetailClientProps {
  project: Project;
}

export default function ProjectDetailClient({
  project,
}: ProjectDetailClientProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const images = project.images ?? [];

  function handleImageClick(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  function handleClose() {
    setLightboxOpen(false);
  }

  function handleNext() {
    setLightboxIndex((prev) => (prev + 1) % images.length);
  }

  function handlePrev() {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  }

  return (
    <>
      <ImageSequence images={images} onImageClick={handleImageClick} />

      <Lightbox
        images={images}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={handleClose}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </>
  );
}
