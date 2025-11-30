"use client";

import {
  Folder,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  File,
} from "lucide-react";
import { IKImage } from "imagekitio-next";
import type { File as FileType } from "@/lib/db/schema";

interface FileIconProps {
  file: FileType;
}

export default function FileIcon({ file }: FileIconProps) {
  if (file.isFolder) return <Folder className="h-5 w-5 text-blue-500" />;

  const fileType = file.type.split("/")[0];
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  // Image handling with preview
  if (fileType === "image") {
    return (
      <div className="h-12 w-12 relative overflow-hidden rounded">
        <IKImage
          path={file.path}
          transformation={[
            {
              height: 48,
              width: 48,
              focus: "auto",
              quality: 80,
              dpr: 2,
            },
          ]}
          loading="lazy"
          lqip={{ active: true }}
          alt={file.name}
          style={{ objectFit: "cover", height: "100%", width: "100%" }}
        />
      </div>
    );
  }

  // Specific file type handling based on extension or mime type
  if (fileType === "video") {
    return <FileVideo className="h-6 w-6 text-purple-500" />;
  }

  if (fileType === "audio") {
    return <FileAudio className="h-6 w-6 text-yellow-500" />;
  }

  // Documents
  if (
    ["pdf", "doc", "docx", "odt", "rtf", "txt"].includes(extension) ||
    file.type.includes("pdf") ||
    file.type.includes("document")
  ) {
    return <FileText className="h-6 w-6 text-blue-400" />;
  }

  // Spreadsheets
  if (
    ["xls", "xlsx", "csv", "ods", "numbers"].includes(extension) ||
    file.type.includes("spreadsheet") ||
    file.type.includes("csv") ||
    file.type.includes("excel")
  ) {
    return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
  }

  // Presentations
  if (
    ["ppt", "pptx", "odp", "key"].includes(extension) ||
    file.type.includes("presentation") ||
    file.type.includes("powerpoint")
  ) {
    // Using FileText with orange color for presentations as a fallback for specific presentation icon
    return <FileText className="h-6 w-6 text-orange-500" />;
  }

  // Code
  if (
    [
      "js",
      "jsx",
      "ts",
      "tsx",
      "py",
      "cpp",
      "c",
      "java",
      "html",
      "css",
      "json",
      "xml",
      "yaml",
      "yml",
      "sql",
      "php",
      "rb",
      "go",
      "rs",
      "sh",
    ].includes(extension)
  ) {
    return <FileCode className="h-6 w-6 text-slate-500" />;
  }

  // Archives
  if (
    ["zip", "rar", "7z", "tar", "gz"].includes(extension) ||
    file.type.includes("zip") ||
    file.type.includes("compressed") ||
    file.type.includes("archive")
  ) {
    return <FileArchive className="h-6 w-6 text-amber-600" />;
  }

  // Default fallback
  return <File className="h-6 w-6 text-gray-400" />;
}
