import { useMemo } from 'react';

export default function DownloadRow({ filename, data }) {
  const href = useMemo(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    return URL.createObjectURL(blob);
  }, [data]);

  return (
    <div className="download-row">
      <div>
        <div>{filename}</div>
        <div className="meta">{data.length} notes</div>
      </div>
      <a className="button-link" href={href} download={filename}>
        Download
      </a>
    </div>
  );
}