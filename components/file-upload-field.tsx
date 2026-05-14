"use client";

import { UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";

interface FileUploadFieldProps {
  label: string;
  hint?: string;
  multiple?: boolean;
  resetToken?: number;
  onUploaded: (urls: string[]) => void;
}

interface UploadedFileItem {
  path: string;
  name: string;
}

export function FileUploadField({ label, hint, multiple = false, resetToken = 0, onUploaded }: FileUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setUploadedFiles([]);
    setError("");
  }, [resetToken]);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      const newlyUploadedFiles: UploadedFileItem[] = [];

      for (const file of files) {
        const uploadForm = new FormData();
        uploadForm.append("file", file);

        const response = await fetch("/api/uploads", {
          method: "POST",
          body: uploadForm
        });
        const data = (await response.json()) as { error?: string; path?: string; originalName?: string };

        if (!response.ok || !data.path) {
          throw new Error(data.error || "上传失败");
        }

        newlyUploadedFiles.push({
          path: data.path,
          name: data.originalName || file.name
        });
      }

      setUploadedFiles((current) => {
        const next = [...current, ...newlyUploadedFiles];
        onUploaded(next.map((item) => item.path));
        return next;
      });
    } catch (uploadError) {
      console.error(uploadError);
      setError(uploadError instanceof Error ? uploadError.message : "上传失败，请检查服务端配置。");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function removeUploadedFile(path: string) {
    setUploadedFiles((current) => {
      const next = current.filter((item) => item.path !== path);
      onUploaded(next.map((item) => item.path));
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <label className="card-muted flex cursor-pointer items-center gap-3 px-4 py-4 hover:border-accent-200">
        <UploadCloud className="h-5 w-5 text-accent-500" />
        <div className="text-sm text-slate-600">
          <div>{uploading ? "正在上传截图..." : multiple ? "点击选择多张截图，文件将依次上传到私有证据库" : "点击选择截图，文件将由服务端转存到私有证据库"}</div>
          <div className="mt-1 text-xs text-slate-500">
            {hint || "支持 png / jpg / webp，单张建议不超过 5MB，证据不会以公开链接形式直接暴露。"}
          </div>
        </div>
        <input type="file" accept="image/*" multiple={multiple} className="hidden" onChange={handleChange} />
      </label>
      {uploadedFiles.length > 0 ? (
        <div className="space-y-1 text-sm text-emerald-600">
          <p>已上传 {uploadedFiles.length} 张图片。证据文件将通过限时授权链接查看。</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {uploadedFiles.map((file) => (
              <button
                key={file.path}
                type="button"
                onClick={() => removeUploadedFile(file.path)}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
              >
                {file.name} · 移除
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
