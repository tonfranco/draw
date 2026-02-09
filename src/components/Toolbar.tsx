"use client";

import React from "react";
import { useStore } from "@/store/useStore";
import { Tool } from "@/types";
import {
  MousePointer2,
  Hand,
  Pencil,
  Square,
  Diamond,
  Circle,
  ArrowRight,
  Minus,
  Type,
  Eraser,
} from "lucide-react";

const tools: { tool: Tool; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { tool: "select", icon: <MousePointer2 size={18} />, label: "Select", shortcut: "V" },
  { tool: "hand", icon: <Hand size={18} />, label: "Hand", shortcut: "H" },
  { tool: "rectangle", icon: <Square size={18} />, label: "Rectangle", shortcut: "R" },
  { tool: "diamond", icon: <Diamond size={18} />, label: "Diamond", shortcut: "D" },
  { tool: "ellipse", icon: <Circle size={18} />, label: "Ellipse", shortcut: "O" },
  { tool: "arrow", icon: <ArrowRight size={18} />, label: "Arrow", shortcut: "A" },
  { tool: "line", icon: <Minus size={18} />, label: "Line", shortcut: "L" },
  { tool: "pencil", icon: <Pencil size={18} />, label: "Pencil", shortcut: "P" },
  { tool: "text", icon: <Type size={18} />, label: "Text", shortcut: "T" },
  { tool: "eraser", icon: <Eraser size={18} />, label: "Eraser", shortcut: "E" },
];

export default function Toolbar() {
  const { activeTool, setActiveTool } = useStore();

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-xl shadow-lg px-1.5 py-1.5">
        {tools.map(({ tool, icon, label, shortcut }) => (
          <button
            key={tool}
            onClick={() => setActiveTool(tool)}
            className={`
              relative group flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150
              ${
                activeTool === tool
                  ? "bg-indigo-100 text-indigo-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }
            `}
            title={`${label} (${shortcut})`}
          >
            {icon}
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {label} <span className="text-gray-400 ml-1">{shortcut}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
