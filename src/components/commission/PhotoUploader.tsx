import { useId, useRef, useState, type DragEvent } from 'react';
import type { ReferencePhoto } from '../../data/types';
import { plural } from '../../lib/format';
import { fileToReferencePhoto, MAX_REFERENCE_PHOTOS } from '../../lib/images';
import { Icon } from '../Icons';
import styles from './PhotoUploader.module.css';

interface PhotoUploaderProps {
  photos: ReferencePhoto[];
  onAdd: (photos: ReferencePhoto[]) => void;
  onRemove: (id: string) => void;
  invalid?: boolean;
  describedBy?: string;
  /** what the photos are of, for the empty-state copy */
  subject: 'people' | 'ornament';
}

/** Drag & drop + click-to-choose reference photo picker. Photos are downscaled in the browser. */
export function PhotoUploader({ photos, onAdd, onRemove, invalid, describedBy, subject }: PhotoUploaderProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  // Keep a live count so two quick drops can't sneak past the limit.
  const pendingRef = useRef(0);

  const full = photos.length + busy >= MAX_REFERENCE_PHOTOS;

  async function addFiles(list: FileList | File[]) {
    const files = Array.from(list);
    if (files.length === 0) return;
    const notes: string[] = [];

    const images = files.filter((f) => {
      if (f.type.startsWith('image/')) return true;
      notes.push(`"${f.name}" isn't an image, so I skipped it.`);
      return false;
    });

    const room = MAX_REFERENCE_PHOTOS - photos.length - pendingRef.current;
    let accepted = images;
    if (room <= 0 && images.length > 0) {
      notes.push(`That's the limit: up to ${MAX_REFERENCE_PHOTOS} photos per drawing. Remove one to add another.`);
      accepted = [];
    } else if (images.length > room) {
      notes.push(`Up to ${MAX_REFERENCE_PHOTOS} photos per drawing, so I added the first ${room}.`);
      accepted = images.slice(0, room);
    }

    setMessages(notes);
    if (accepted.length === 0) return;

    pendingRef.current += accepted.length;
    setBusy((b) => b + accepted.length);
    const results = await Promise.allSettled(accepted.map((f) => fileToReferencePhoto(f)));
    pendingRef.current -= accepted.length;
    setBusy((b) => b - accepted.length);

    const ok: ReferencePhoto[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') ok.push(r.value);
      else notes.push(`I couldn't read "${accepted[i].name}". Try a JPEG or PNG (a screenshot works too).`);
    });
    if (ok.length) onAdd(ok);
    setMessages([...notes]);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer?.files?.length) void addFiles(e.dataTransfer.files);
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = full ? 'none' : 'copy';
    if (!dragging) setDragging(true);
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
  }

  const zoneClass = [styles.zone, dragging ? styles.dragging : '', invalid ? styles.invalid : '', full ? styles.full : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrap}>
      <div className={zoneClass} onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <input
          ref={inputRef}
          id={`${id}-input`}
          className={styles.input}
          type="file"
          accept="image/*"
          multiple
          disabled={full}
          aria-describedby={[`${id}-help`, describedBy].filter(Boolean).join(' ')}
          aria-invalid={invalid || undefined}
          onChange={(e) => {
            const files = e.currentTarget.files;
            if (files) void addFiles(files);
            e.currentTarget.value = '';
          }}
        />
        <label htmlFor={`${id}-input`} className={styles.label}>
          <span className={styles.zoneIcon} aria-hidden="true">
            <Icon name={dragging ? 'sparkle' : 'camera'} size={30} />
          </span>
          <span className={styles.zoneText}>
            {full ? (
              <strong>All {MAX_REFERENCE_PHOTOS} photo spots are filled</strong>
            ) : dragging ? (
              <strong>Drop them right here!</strong>
            ) : (
              <>
                <strong>
                  <span className={styles.fakeLink}>Choose photos</span> or drag them here
                </strong>
                <span id={`${id}-help`} className={styles.zoneHint}>
                  {subject === 'ornament'
                    ? `A photo of the ornament or object, from any angle. Up to ${MAX_REFERENCE_PHOTOS}.`
                    : `Faces, outfits, pets: casual snaps are perfect. Up to ${MAX_REFERENCE_PHOTOS}.`}
                </span>
              </>
            )}
          </span>
        </label>
      </div>

      {(photos.length > 0 || busy > 0) && (
        <ul className={styles.grid} aria-label="Your reference photos">
          {photos.map((p, i) => (
            <li key={p.id} className={`${styles.thumb} pop-in`} style={{ ['--tilt' as string]: `${i % 2 ? 1.5 : -1.5}deg` }}>
              <img src={p.dataUrl} alt={`Reference photo: ${p.name}`} />
              <button type="button" className={styles.remove} onClick={() => {
                  setMessages([]);
                  onRemove(p.id);
                }}
                aria-label={`Remove ${p.name}`}>
                <Icon name="close" size={16} strokeWidth={3} />
              </button>
            </li>
          ))}
          {Array.from({ length: busy }, (_, i) => (
            <li key={`busy-${i}`} className={`${styles.thumb} ${styles.busy}`} aria-hidden="true">
              <span className={styles.spinner} />
            </li>
          ))}
        </ul>
      )}

      <div className={styles.status} aria-live="polite">
        {busy > 0 && (
          <p className={styles.busyText}>
            <span className={styles.spinnerSmall} aria-hidden="true" /> Getting {busy === 1 ? 'your photo' : `${busy} photos`} ready…
          </p>
        )}
        {photos.length > 0 && busy === 0 && (
          <p className="hint">
            {plural(photos.length, 'photo')} added ·{' '}
            {photos.length >= MAX_REFERENCE_PHOTOS ? "that's the max" : `room for ${MAX_REFERENCE_PHOTOS - photos.length} more`}
          </p>
        )}
        {messages.map((m) => (
          <p key={m} className={styles.message}>
            <Icon name="info" size={16} /> {m}
          </p>
        ))}
      </div>
    </div>
  );
}
