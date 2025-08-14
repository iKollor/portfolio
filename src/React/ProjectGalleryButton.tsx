import React, { useState } from "react";
import GalleryModal, { MediaItem } from "./GalleryModal";

export interface ProjectGalleryButtonProps {
  media: MediaItem[];
  label?: string;
  iconOnly?: boolean;
}

const ProjectGalleryButton: React.FC<ProjectGalleryButtonProps> = ({ media, label = "Galería", iconOnly }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="size-14 flex justify-center items-center text-[var(--white-icon)] hover:text-white transition duration-300 ease-in-out border border-1 border-[var(--white-icon-tr)] p-3 rounded-xl bg-[#1414149c] hover:bg-[var(--white-icon-tr)]"
        title={label}
        aria-label={label}
      >
        {/* Icono de galería */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-7">
          <path d="M21 19V5a2 2 0 0 0-2-2H5c-1.11 0-2 .9-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3.01L14.5 12l3.5 4.5V19H6v-2l2.5-3.5zM8 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
        </svg>
        {!iconOnly && <span className="sr-only">{label}</span>}
      </button>
      <GalleryModal open={open} onClose={() => setOpen(false)} media={media} />
    </>
  );
};

export default ProjectGalleryButton;
