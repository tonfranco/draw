"use client";

import React, { useState, useRef } from "react";
import { useStore } from "@/store/useStore";
import {
  Menu,
  Download,
  Upload,
  Image,
  Trash2,
  Undo2,
  Redo2,
} from "lucide-react";

export default function ActionsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { undo, redo, elements, setElements, exportAsJSON, importFromJSON, pushHistory } =
    useStore();

  const handleExportJSON = () => {
    const json = exportAsJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "drawboard-export.json";
    a.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const handleImportJSON = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      importFromJSON(text);
    };
    reader.readAsText(file);
    setIsOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExportPNG = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    // Create a temporary canvas with white background
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCtx.fillStyle = "#ffffff";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    const url = tempCanvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "drawboard-export.png";
    a.click();
    setIsOpen(false);
  };

  const handleClearCanvas = () => {
    if (confirm("Are you sure you want to clear the canvas?")) {
      setElements([]);
      pushHistory();
    }
    setIsOpen(false);
  };

  return (
    <>
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-xl shadow-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
        >
          <Menu size={18} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-12 left-0 z-50 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2">
              <button
                onClick={undo}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Undo2 size={16} />
                <span>Undo</span>
                <span className="ml-auto text-xs text-gray-400">⌘Z</span>
              </button>
              <button
                onClick={redo}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Redo2 size={16} />
                <span>Redo</span>
                <span className="ml-auto text-xs text-gray-400">⌘⇧Z</span>
              </button>

              <div className="border-t border-gray-100 my-1" />

              <button
                onClick={handleExportPNG}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Image size={16} />
                <span>Export as PNG</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download size={16} />
                <span>Export as JSON</span>
              </button>
              <button
                onClick={handleImportJSON}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Upload size={16} />
                <span>Import JSON</span>
              </button>

              <div className="border-t border-gray-100 my-1" />

              <button
                onClick={handleClearCanvas}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
                <span>Clear canvas</span>
              </button>
            </div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
