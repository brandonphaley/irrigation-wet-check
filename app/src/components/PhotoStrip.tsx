import { useEffect, useRef, useState } from "react";
import { CameraIcon } from "./Icons";
import { getPhoto } from "../db/repo";

function PhotoThumb({ id }: { id: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let revoked: string | null = null;
    let active = true;
    getPhoto(id).then((p) => {
      if (p && active) {
        const u = URL.createObjectURL(p.blob);
        revoked = u;
        setUrl(u);
      }
    });
    return () => {
      active = false;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [id]);
  if (!url) return <div className="photo-thumb mono">…</div>;
  return <img className="photo-thumb" src={url} alt="zone photo" />;
}

interface Props {
  photoIds: string[];
  onCapture: (file: File) => void;
}

/**
 * Photo capture via the device camera (real, works on mobile).
 * On phones the file input with capture=environment opens the camera;
 * on desktop it opens a file picker.
 */
export function PhotoStrip({ photoIds, onCapture }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="photos">
      {photoIds.map((id) => (
        <PhotoThumb key={id} id={id} />
      ))}
      <button
        className="photo-thumb add"
        style={{ color: "var(--accent)", border: "1px dashed var(--line-2)" }}
        onClick={() => inputRef.current?.click()}
        aria-label="Add photo"
      >
        <CameraIcon />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onCapture(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
