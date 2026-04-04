import JSZip from 'jszip';
import { useEffect, useState } from 'react';

export default function DownloadRow({ filename, files }) {
  const [href, setHref] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl = '';

    async function buildArchive() {
      const zip = new JSZip();

      files.forEach((file) => {
        zip.file(file.name.replace(/^.*\//, ''), JSON.stringify(file.data, null, 2));
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      if (!active) return;

      objectUrl = URL.createObjectURL(blob);
      setHref(objectUrl);
    }

    setHref('');
    void buildArchive();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [files]);

  return (
    <div className="download-row">
      <div>
        <div>{filename}</div>
        <div className="meta">{files.length} JSON file(s) in ZIP</div>
      </div>
      <a
        className="button-link"
        href={href || undefined}
        download={filename}
        aria-disabled={!href}
      >
        Download
      </a>
    </div>
  );
}
