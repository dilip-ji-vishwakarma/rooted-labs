import { API_BASE } from "@/lib/api/config";
import { useEffect, useState } from "react";

type FileType = {
  url?: string; // optional
  name?: string; // optional
  size?: number; // optional
};

export const useUpload = ({
  value,
  onChange,
  allowedTypes,
  maxSizeMB,
}: {
  value: FileType | null;
  onChange: (prop: string) => void;
  allowedTypes: string[];
  maxSizeMB: number;
}) => {
  const [data, setData] = useState<FileType | null>(null);
  const [process, setProcess] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (typeof value === "string") {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setData(JSON.parse(value));
      } catch {
        setData(null);
      }
    } else {
      setData(value);
    }
  }, [value]);

  async function onUpload(file: File) {
    setError(null);
    if (!file) return;

    // ✅ check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB} MB`);
      return;
    }

    // ✅ check file type
    if (!allowedTypes.includes(file.type)) {
      setError(`Invalid file type. Allowed: ${allowedTypes.join(", ")}`);
      return;
    }

    const formData = new FormData();
    formData.append("files", file);
    setProcess(true);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          console.log(`Upload progress: ${percent}%`);
          setProgress(percent); // 👈 state hook for progress bar
        }
      };

      xhr.onload = () => {
        setProcess(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          console.log("Upload success:", data);

          if (data?.items?.[0]) {
            const result = data.items[0];
            console.group({ result });
            onChange?.(
              JSON.stringify({
                url: result.absolute_ui_url,
                name: result.stored_name,
                size: result.size,
              })
            );
          } else {
            setError("Something went wrong");
          }
        } else {
          setError(xhr.statusText);
        }
      };

      xhr.onerror = () => {
        setProcess(false);
        setError("Upload failed");
      };

      const FINAL_API_BASE = API_BASE.endsWith("/api")
        ? API_BASE.replace("/api", "")
        : API_BASE;

      xhr.open("POST", `${FINAL_API_BASE}/doc/`, true);
      xhr.setRequestHeader("Accept", "application/json");
      xhr.send(formData);
    } catch (error) {
      setProcess(false);
      console.error("Upload failed:", error);
    }
  }

  function humanSize(bytes: number | undefined) {
    if (!bytes) return "";
    if (!Number.isFinite(bytes)) return "";
    if (bytes === 0) return "0B";
    const k = 1024;
    const units = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)}${units[i]}`;
  }
  return { data, onUpload, error, humanSize, process, progress };
};
