"use client";

import React, { useState, useRef } from "react";
import { useStore } from "@/store/useStore";
import {
  Menu,
  X,
  Download,
  Upload,
  Image,
  Trash2,
  Undo2,
  Redo2,
  FileJson,
  Pencil,
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
    if (confirm("Tem certeza que deseja limpar o canvas?")) {
      setElements([]);
      pushHistory();
    }
    setIsOpen(false);
  };

  const elementCount = elements.length;

  return (
    <>
      {/* Trigger button */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-xl shadow-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Overlay + Sidebar */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[200] transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed top-3 left-3 h-[calc(100%-24px)] w-72 bg-white shadow-2xl z-[201] flex flex-col animate-in slide-in-from-left duration-200 rounded-2xl border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <Pencil size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 leading-none">DrawBoard</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">{elementCount} elemento{elementCount !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Menu items */}
            <div className="flex-1 overflow-y-auto py-2">
              {/* Edit section */}
              <div className="px-4 pt-3 pb-1.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Editar</span>
              </div>
              <div className="px-2">
                <button
                  onClick={() => { undo(); setIsOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                    <Undo2 size={15} className="text-gray-500 group-hover:text-indigo-600" />
                  </div>
                  <span className="font-medium">Desfazer</span>
                  <kbd className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">⌘Z</kbd>
                </button>
                <button
                  onClick={() => { redo(); setIsOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                    <Redo2 size={15} className="text-gray-500 group-hover:text-indigo-600" />
                  </div>
                  <span className="font-medium">Refazer</span>
                  <kbd className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">⌘⇧Z</kbd>
                </button>
              </div>

              {/* Export section */}
              <div className="px-4 pt-5 pb-1.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Exportar</span>
              </div>
              <div className="px-2">
                <button
                  onClick={handleExportPNG}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                    <Image size={15} className="text-gray-500 group-hover:text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium block leading-tight">Exportar PNG</span>
                    <span className="text-[11px] text-gray-400">Salvar como imagem</span>
                  </div>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                    <Download size={15} className="text-gray-500 group-hover:text-blue-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium block leading-tight">Exportar JSON</span>
                    <span className="text-[11px] text-gray-400">Backup do projeto</span>
                  </div>
                </button>
              </div>

              {/* Import section */}
              <div className="px-4 pt-5 pb-1.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Importar</span>
              </div>
              <div className="px-2">
                <button
                  onClick={handleImportJSON}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                    <Upload size={15} className="text-gray-500 group-hover:text-amber-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium block leading-tight">Importar JSON</span>
                    <span className="text-[11px] text-gray-400">Carregar projeto salvo</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer - danger zone */}
            <div className="border-t border-gray-100 p-3">
              <button
                onClick={handleClearCanvas}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                  <Trash2 size={15} className="text-red-400 group-hover:text-red-600" />
                </div>
                <span className="font-medium">Limpar canvas</span>
              </button>
            </div>
          </div>
        </>
      )}

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
