import { useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import DownloadRow from './DownloadRow';
import CollapsiblePanel from '../CollapsiblePanel';
import type { DownloadFile, TrackEvents } from '../../types';
import { buildCompactGrid, buildTickGrid, toMinecraftBuildGrid } from '../SchematicPanel/schematicData';
import { buildSchematicWorkbook } from '../SchematicPanel/exportExcel';
import { buildSchematicCsv, buildSchematicOds } from '../SchematicPanel/exportSpreadsheet';
import { buildMinecraftFunction, type MinecraftEdition } from '../SchematicPanel/exportMinecraft';

interface JsonOutputPanelProps {
  downloadFiles: DownloadFile[];
  zipFilename: string;
  trackEvents: TrackEvents[];
}

type SpreadsheetBuildView = 'classic' | 'compact' | 'minecraft';
type SpreadsheetFormat = 'xlsx' | 'ods' | 'csv';
type MinecraftBuildView = 'full' | 'compact';

const spreadsheetFormats: { id: SpreadsheetFormat; label: string }[] = [
  { id: 'xlsx', label: 'Excel (.xlsx)' },
  { id: 'ods', label: 'OpenDocument (.ods)' },
  { id: 'csv', label: 'CSV (.csv)' }
];

export default function JsonOutputPanel({ downloadFiles, zipFilename, trackEvents }: JsonOutputPanelProps) {
  const fullGrid = useMemo(() => buildTickGrid(trackEvents), [trackEvents]);
  const compactGrid = useMemo(() => buildCompactGrid(trackEvents), [trackEvents]);
  const [spreadsheetBuildView, setSpreadsheetBuildView] = useState<SpreadsheetBuildView>('minecraft');
  const spreadsheetGrid = useMemo(() => {
    if (spreadsheetBuildView === 'classic') return fullGrid;
    if (spreadsheetBuildView === 'compact') return toMinecraftBuildGrid(compactGrid);
    return toMinecraftBuildGrid(fullGrid);
  }, [compactGrid, fullGrid, spreadsheetBuildView]);
  const [minecraftEdition, setMinecraftEdition] = useState<MinecraftEdition>('java');
  const [exportError, setExportError] = useState('');
  const [spreadsheetModalOpen, setSpreadsheetModalOpen] = useState(false);
  const [spreadsheetFormatsSelected, setSpreadsheetFormatsSelected] = useState<SpreadsheetFormat[]>(['xlsx', 'ods', 'csv']);
  const [minecraftModalOpen, setMinecraftModalOpen] = useState(false);
  const [minecraftBuildView, setMinecraftBuildView] = useState<MinecraftBuildView>('full');
  const [copyStatus, setCopyStatus] = useState('');
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const spreadsheetCloseRef = useRef<HTMLButtonElement>(null);
  const spreadsheetExportRef = useRef<HTMLButtonElement>(null);
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const minecraftModalRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const minecraftFunction = useMemo(
    () => buildMinecraftFunction(minecraftBuildView === 'full' ? fullGrid : compactGrid, minecraftEdition),
    [compactGrid, fullGrid, minecraftBuildView, minecraftEdition]
  );

  async function exportAs(filename: string, build: () => Blob | Promise<Blob>): Promise<boolean> {
    setExportError('');
    try {
      const url = URL.createObjectURL(await build());
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed.');
      return false;
    }
  }

  async function exportSpreadsheets() {
    setExportError('');
    try {
      const zip = new JSZip();
      const exports = await Promise.all(
        spreadsheetFormatsSelected.map(async (format) => {
          if (format === 'xlsx') return ['schematic.xlsx', await buildSchematicWorkbook(spreadsheetGrid)] as const;
          if (format === 'ods') return ['schematic.ods', await buildSchematicOds(spreadsheetGrid)] as const;
          return [
            'schematic.csv',
            new Blob([buildSchematicCsv(spreadsheetGrid)], { type: 'text/csv;charset=utf-8' })
          ] as const;
        })
      );
      exports.forEach(([filename, blob]) => zip.file(filename, blob));
      const blob = await zip.generateAsync({ type: 'blob' });
      if (await exportAs('schematic-spreadsheets.zip', () => blob)) setSpreadsheetModalOpen(false);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Spreadsheet export failed.');
    }
  }

  function toggleSpreadsheetFormat(format: SpreadsheetFormat) {
    setSpreadsheetFormatsSelected((selected) =>
      selected.includes(format) ? selected.filter((item) => item !== format) : [...selected, format]
    );
  }

  function closeMinecraftModal() {
    setMinecraftModalOpen(false);
    openerRef.current?.focus();
  }

  async function copyPreview() {
    try {
      await navigator.clipboard.writeText(minecraftFunction);
      setCopyStatus('Copied to clipboard.');
    } catch {
      setCopyStatus('Could not copy to clipboard. Check browser clipboard permissions.');
    }
  }

  useEffect(() => {
    if (!minecraftModalOpen) return undefined;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMinecraftModalOpen(false);
        openerRef.current?.focus();
      } else if (event.key === 'Tab') {
        event.preventDefault();
        const focusable = minecraftModalRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), select, input:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;
        const currentIndex = Array.from(focusable).indexOf(document.activeElement as HTMLElement);
        const nextIndex = (currentIndex + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
        focusable[nextIndex].focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [minecraftModalOpen]);

  useEffect(() => {
    if (!spreadsheetModalOpen) return undefined;
    spreadsheetCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSpreadsheetModalOpen(false);
        openerRef.current?.focus();
      } else if (event.key === 'Tab') {
        event.preventDefault();
        if (document.activeElement === spreadsheetCloseRef.current) spreadsheetExportRef.current?.focus();
        else spreadsheetCloseRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [spreadsheetModalOpen]);

  return (
    <CollapsiblePanel
      title="Output"
      collapsible={false}
      className="outputs"
    >
      <p className="hint output-summary">
        {downloadFiles.length === 0
          ? 'No output yet.'
          : `${downloadFiles.length} file(s) packaged into ${zipFilename}.`}
      </p>
      <div className="downloads">
        <DownloadRow filename={zipFilename} files={downloadFiles} />
      </div>
      <div className="output-exports">
        <section className="output-export-box" aria-labelledby="spreadsheet-export-title">
          <h3 id="spreadsheet-export-title">Schematic to spreadsheet export</h3>
          <div className="output-export-row">
            <button
              type="button"
              onClick={() => {
                openerRef.current = document.activeElement as HTMLElement | null;
                setSpreadsheetModalOpen(true);
              }}
              disabled={fullGrid.instruments.length === 0}
            >
              Export spreadsheet (.xlsx, .ods, .csv)
            </button>
          </div>
          {exportError ? (
            <p className="hint" role="alert">
              {exportError}
            </p>
          ) : null}
        </section>
        <section className="output-export-box" aria-labelledby="minecraft-export-title">
          <h3 id="minecraft-export-title">Minecraft function export</h3>
          <div className="output-export-row">
            <button
              type="button"
              onClick={() => {
                openerRef.current = document.activeElement as HTMLElement | null;
                setCopyStatus('');
                setMinecraftModalOpen(true);
              }}
              disabled={fullGrid.instruments.length === 0}
            >
              Export Minecraft function
            </button>
          </div>
          <p className="hint">
            Minecraft functions use relative coordinates from the ground-level origin. Java exports preserve note pitches; Bedrock exports need manual tuning after placement, with target pitches listed in comments.
          </p>
        </section>
      </div>
      {spreadsheetModalOpen ? (
        <div
          className="function-preview-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="spreadsheet-modal-title"
          onClick={() => {
            setSpreadsheetModalOpen(false);
            openerRef.current?.focus();
          }}
        >
          <section className="function-preview spreadsheet-export-modal" onClick={(event) => event.stopPropagation()}>
            <header className="function-preview__header">
              <h2 id="spreadsheet-modal-title">Schematic to spreadsheet export</h2>
              <button
                ref={spreadsheetCloseRef}
                type="button"
                aria-label="Close spreadsheet export options"
                onClick={() => {
                  setSpreadsheetModalOpen(false);
                  openerRef.current?.focus();
                }}
              >
                Close
              </button>
            </header>
            <label className="option-row option-row-stacked">
              <span>Build view</span>
              <select
                value={spreadsheetBuildView}
                onChange={(e) => setSpreadsheetBuildView(e.target.value as SpreadsheetBuildView)}
              >
                <option value="classic">Classic</option>
                <option value="compact">Compact build (no ticks, minimal padding)</option>
                <option value="minecraft">Full Minecraft build</option>
              </select>
            </label>
            <fieldset className="spreadsheet-format-options">
              <legend>File formats <span>(exported together in a ZIP)</span></legend>
              {spreadsheetFormats.map(({ id, label }) => (
                <label key={id}>
                  <input
                    type="checkbox"
                    checked={spreadsheetFormatsSelected.includes(id)}
                    onChange={() => toggleSpreadsheetFormat(id)}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <footer className="function-preview__footer">
              <button
                ref={spreadsheetExportRef}
                type="button"
                disabled={spreadsheetFormatsSelected.length === 0}
                onClick={() => void exportSpreadsheets()}
              >
                Export spreadsheet (.xlsx, .ods, .csv)
              </button>
            </footer>
          </section>
        </div>
      ) : null}
      {minecraftModalOpen ? (
        <div
          className="function-preview-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="function-preview-title"
          onClick={closeMinecraftModal}
        >
          <section
            ref={minecraftModalRef}
            className="function-preview"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="function-preview__header">
              <h2 id="function-preview-title">
                {`schematic-${minecraftEdition}-${minecraftBuildView}.mcfunction`}
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeMinecraftModal}
                aria-label="Close Minecraft function preview"
              >
                Close
              </button>
            </header>
            <div className="minecraft-function-options">
              <label className="option-row option-row-stacked">
                <span>Minecraft edition</span>
                <select
                  value={minecraftEdition}
                  onChange={(e) => {
                    setMinecraftEdition(e.target.value as MinecraftEdition);
                    setCopyStatus('');
                  }}
                >
                  <option value="java">Java Edition</option>
                  <option value="bedrock">Bedrock Edition</option>
                </select>
              </label>
              <label className="option-row option-row-stacked">
                <span>Build view</span>
                <select
                  value={minecraftBuildView}
                  onChange={(e) => {
                    setMinecraftBuildView(e.target.value as MinecraftBuildView);
                    setCopyStatus('');
                  }}
                >
                  <option value="full">Full Minecraft build</option>
                  <option value="compact">Compact build</option>
                </select>
              </label>
            </div>
            <pre className="function-preview__content">{minecraftFunction}</pre>
            <footer className="function-preview__footer">
              {copyStatus ? <p role={copyStatus.startsWith('Could not') ? 'alert' : 'status'}>{copyStatus}</p> : null}
              <button
                type="button"
                onClick={() =>
                  void exportAs(
                    `schematic-${minecraftEdition}-${minecraftBuildView}.txt`,
                    () => new Blob([minecraftFunction], { type: 'text/plain;charset=utf-8' })
                  )
                }
              >
                Export as .txt file
              </button>
              <button ref={copyButtonRef} type="button" onClick={() => void copyPreview()}>
                Copy to clipboard
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </CollapsiblePanel>
  );
}
