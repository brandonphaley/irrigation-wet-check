import { useRef, useState } from "react";
import type { Zone } from "../types";
import { buildTemplate, downloadCsv, parseCsv, type CsvResult, type CsvUpdate } from "../lib/csv";
import { UploadIcon } from "./Icons";

interface Props {
  zones: Zone[];
  onImport: (updates: CsvUpdate[]) => void;
}

export function CsvImporter({ zones, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<CsvResult | null>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result ?? "");
      const { updates, result } = parseCsv(text, zones);
      if (result.ok) onImport(updates);
      setStatus(result);
    };
    reader.readAsText(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  return (
    <div className="csv-card">
      <div
        className="csv-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
      >
        <div className="ico">
          <UploadIcon />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="title">Import zones from CSV</div>
          <div className="sub">
            Tap to browse or drop a file · expects <span className="mono">zone, name, A_runtime, A_days, …</span>
          </div>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, padding: "0 2px" }}>
        <button
          className="link-btn accent"
          onClick={() => downloadCsv("ssc-zones-template.csv", buildTemplate(zones))}
        >
          ↓ Download template
        </button>
        {status && status.ok && (
          <span className="spill ok mono">
            {status.count} updated · {status.errors && status.errors.length ? `${status.errors.length} skipped` : "no errors"}
          </span>
        )}
        {status && !status.ok && <span className="spill crit">{status.message}</span>}
      </div>
    </div>
  );
}
