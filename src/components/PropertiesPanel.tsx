"use client";

import React from "react";
import { useStore } from "@/store/useStore";
import { StrokeWidth } from "@/types";
import {
  ArrowDown,
  ArrowUp,
  ArrowDownToLine,
  ArrowUpToLine,
} from "lucide-react";

const STROKE_COLORS = [
  "#1e1e1e",
  "#e03131",
  "#2f9e44",
  "#1971c2",
  "#0c8599",
  "#f08c00",
];

const BG_COLORS = [
  "transparent",
  "#ffc9c9",
  "#b2f2bb",
  "#a5d8ff",
  "#99e9f2",
  "#ffec99",
];

export default function PropertiesPanel() {
  const {
    strokeColor,
    setStrokeColor,
    backgroundColor,
    setBackgroundColor,
    strokeWidth,
    setStrokeWidth,
    opacity,
    setOpacity,
    selectedElementIds,
    elements,
    moveElementUp,
    moveElementDown,
    moveElementToTop,
    moveElementToBottom,
  } = useStore();

  const selectedElement =
    selectedElementIds.length === 1
      ? elements.find((el) => el.id === selectedElementIds[0])
      : null;

  const currentStroke = selectedElement?.strokeColor || strokeColor;
  const currentBg = selectedElement?.backgroundColor || backgroundColor;
  const currentWidth = selectedElement?.strokeWidth || strokeWidth;
  const currentOpacity = selectedElement?.opacity ?? opacity;

  return (
    <div className="absolute top-20 left-4 z-40 w-52 bg-white border border-gray-200 rounded-xl shadow-lg p-4 space-y-5">
      {/* Stroke Color */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Stroke
        </label>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {STROKE_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setStrokeColor(color)}
              className={`w-7 h-7 rounded-md border-2 transition-all ${
                currentStroke === color
                  ? "border-indigo-500 scale-110 shadow-sm"
                  : "border-gray-200 hover:border-gray-400"
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          <div className="relative">
            <input
              type="color"
              value={currentStroke}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-7 h-7 rounded-md border-2 border-gray-200 cursor-pointer appearance-none bg-transparent"
              title="Custom color"
            />
          </div>
        </div>
      </div>

      {/* Background Color */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Background
        </label>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {BG_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setBackgroundColor(color)}
              className={`w-7 h-7 rounded-md border-2 transition-all ${
                currentBg === color
                  ? "border-indigo-500 scale-110 shadow-sm"
                  : "border-gray-200 hover:border-gray-400"
              } ${color === "transparent" ? "bg-white" : ""}`}
              style={
                color === "transparent"
                  ? {
                      backgroundImage:
                        "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                      backgroundSize: "8px 8px",
                      backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                    }
                  : { backgroundColor: color }
              }
              title={color === "transparent" ? "No fill" : color}
            />
          ))}
          <div className="relative">
            <input
              type="color"
              value={currentBg === "transparent" ? "#ffffff" : currentBg}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-7 h-7 rounded-md border-2 border-gray-200 cursor-pointer appearance-none bg-transparent"
              title="Custom color"
            />
          </div>
        </div>
      </div>

      {/* Stroke Width */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Stroke width
        </label>
        <div className="flex gap-2 mt-2">
          {([1, 2, 4] as StrokeWidth[]).map((w) => (
            <button
              key={w}
              onClick={() => setStrokeWidth(w)}
              className={`flex items-center justify-center w-9 h-9 rounded-lg border-2 transition-all ${
                currentWidth === w
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-400"
              }`}
              title={`${w}px`}
            >
              <div
                className="bg-gray-800 rounded-full"
                style={{ width: 20, height: w }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Opacity
        </label>
        <div className="flex items-center gap-3 mt-2">
          <input
            type="range"
            min={0}
            max={100}
            value={currentOpacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-xs text-gray-500 w-8 text-right font-mono">
            {currentOpacity}
          </span>
        </div>
      </div>

      {/* Layers */}
      {selectedElement && (
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Layers
          </label>
          <div className="flex gap-1.5 mt-2">
            <button
              onClick={() => moveElementToBottom(selectedElement.id)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
              title="Send to back"
            >
              <ArrowDownToLine size={14} />
            </button>
            <button
              onClick={() => moveElementDown(selectedElement.id)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
              title="Send backward"
            >
              <ArrowDown size={14} />
            </button>
            <button
              onClick={() => moveElementUp(selectedElement.id)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
              title="Bring forward"
            >
              <ArrowUp size={14} />
            </button>
            <button
              onClick={() => moveElementToTop(selectedElement.id)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
              title="Bring to front"
            >
              <ArrowUpToLine size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
