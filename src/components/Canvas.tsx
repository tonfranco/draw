"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { useStore } from "@/store/useStore";
import { BaseElement, Point } from "@/types";
import { drawElement, getElementAtPosition, getResizeHandle } from "@/utils/canvas";

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  const {
    activeTool,
    elements,
    canvasState,
    setCanvasState,
    addElement,
    updateElement,
    deleteElement,
    selectedElementIds,
    setSelectedElementIds,
    clearSelection,
    strokeColor,
    backgroundColor,
    strokeWidth,
    opacity,
    pushHistory,
    setActiveTool,
  } = useStore();

  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [currentElementId, setCurrentElementId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [panStart, setPanStart] = useState<Point | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeOrigin, setResizeOrigin] = useState<{ el: BaseElement; mouseStart: Point } | null>(null);
  const [textEditPos, setTextEditPos] = useState<Point | null>(null);
  const [textEditId, setTextEditId] = useState<string | null>(null);
  const textJustOpened = useRef(false);

  // Screen to canvas coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): Point => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: screenX, y: screenY };
      return {
        x: (screenX - rect.left - canvasState.offsetX) / canvasState.zoom,
        y: (screenY - rect.top - canvasState.offsetY) / canvasState.zoom,
      };
    },
    [canvasState]
  );

  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    // Draw grid dots
    ctx.save();
    ctx.translate(canvasState.offsetX, canvasState.offsetY);
    ctx.scale(canvasState.zoom, canvasState.zoom);

    const gridSize = 20;
    const startX = Math.floor(-canvasState.offsetX / canvasState.zoom / gridSize) * gridSize;
    const startY = Math.floor(-canvasState.offsetY / canvasState.zoom / gridSize) * gridSize;
    const endX = startX + (canvas.clientWidth / canvasState.zoom) + gridSize;
    const endY = startY + (canvas.clientHeight / canvasState.zoom) + gridSize;

    ctx.fillStyle = "#e0e0e0";
    for (let x = startX; x < endX; x += gridSize) {
      for (let y = startY; y < endY; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw elements
    for (const el of elements) {
      drawElement(ctx, el, selectedElementIds.includes(el.id));
    }

    ctx.restore();
  }, [elements, canvasState, selectedElementIds]);

  useEffect(() => {
    const animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [render]);

  // Resize canvas on window resize
  useEffect(() => {
    const handleResize = () => render();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [render]);

  // Handle text input submit
  const handleTextSubmit = useCallback(() => {
    if (!textInputRef.current || !textEditPos) return;
    const text = textInputRef.current.value.trim();
    if (text) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      let width = 100;
      let height = 24;
      if (ctx) {
        ctx.font = '20px "Segoe UI", system-ui, sans-serif';
        const lines = text.split("\n");
        width = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 10;
        height = lines.length * 24;
      }

      if (textEditId) {
        updateElement(textEditId, { text, width, height });
      } else {
        addElement({
          type: "text",
          x: textEditPos.x,
          y: textEditPos.y,
          width,
          height,
          strokeColor,
          backgroundColor: "transparent",
          strokeWidth,
          opacity,
          text,
          fontSize: 20,
        });
      }
      pushHistory();
    }
    setTextEditPos(null);
    setTextEditId(null);
  }, [textEditPos, textEditId, strokeColor, strokeWidth, opacity, addElement, updateElement, pushHistory]);

  // Mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // If text editor is open and user clicks on canvas, submit text first
      if (textEditPos && activeTool === "text") {
        handleTextSubmit();
        return;
      }

      const pos = screenToCanvas(e.clientX, e.clientY);

      // Middle mouse button or hand tool = pan
      if (e.button === 1 || activeTool === "hand") {
        setIsPanning(true);
        setPanStart({ x: e.clientX - canvasState.offsetX, y: e.clientY - canvasState.offsetY });
        return;
      }

      if (e.button !== 0) return;

      if (activeTool === "select") {
        // Check resize handles first
        if (selectedElementIds.length === 1) {
          const selectedEl = elements.find((el) => el.id === selectedElementIds[0]);
          if (selectedEl) {
            const handle = getResizeHandle(pos.x, pos.y, selectedEl);
            if (handle) {
              setResizeHandle(handle);
              setResizeOrigin({ el: { ...selectedEl }, mouseStart: pos });
              setIsDrawing(true);
              return;
            }
          }
        }

        const clickedElement = getElementAtPosition(pos.x, pos.y, elements);
        if (clickedElement) {
          if (e.shiftKey) {
            if (selectedElementIds.includes(clickedElement.id)) {
              setSelectedElementIds(selectedElementIds.filter((id) => id !== clickedElement.id));
            } else {
              setSelectedElementIds([...selectedElementIds, clickedElement.id]);
            }
          } else {
            if (!selectedElementIds.includes(clickedElement.id)) {
              setSelectedElementIds([clickedElement.id]);
            }
          }
          setDragStart(pos);
          setIsDrawing(true);
        } else {
          clearSelection();
        }
        return;
      }

      if (activeTool === "eraser") {
        const clickedElement = getElementAtPosition(pos.x, pos.y, elements);
        if (clickedElement) {
          deleteElement(clickedElement.id);
          pushHistory();
        }
        setIsDrawing(true);
        return;
      }

      if (activeTool === "text") {
        // Text tool: mark position on mouseDown, open editor on mouseUp
        setDragStart(pos);
        return;
      }

      // Drawing tools
      if (activeTool === "pencil") {
        const id = addElement({
          type: "pencil",
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          strokeColor,
          backgroundColor,
          strokeWidth,
          opacity,
          points: [pos],
        });
        setCurrentElementId(id);
        setIsDrawing(true);
        return;
      }

      // Shape tools
      if (["rectangle", "diamond", "ellipse", "line", "arrow"].includes(activeTool)) {
        const id = addElement({
          type: activeTool as BaseElement["type"],
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          strokeColor,
          backgroundColor,
          strokeWidth,
          opacity,
        });
        setCurrentElementId(id);
        setIsDrawing(true);
        setDragStart(pos);
        return;
      }
    },
    [
      activeTool,
      screenToCanvas,
      canvasState,
      elements,
      selectedElementIds,
      strokeColor,
      backgroundColor,
      strokeWidth,
      opacity,
      addElement,
      clearSelection,
      deleteElement,
      pushHistory,
      setSelectedElementIds,
      textEditPos,
      handleTextSubmit,
    ]
  );

  // Mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = screenToCanvas(e.clientX, e.clientY);

      if (isPanning && panStart) {
        setCanvasState({
          offsetX: e.clientX - panStart.x,
          offsetY: e.clientY - panStart.y,
        });
        return;
      }

      if (!isDrawing) return;

      if (activeTool === "select") {
        // Resizing
        if (resizeHandle && resizeOrigin) {
          const origEl = resizeOrigin.el;
          const dx = pos.x - resizeOrigin.mouseStart.x;
          const dy = pos.y - resizeOrigin.mouseStart.y;

          let newX = origEl.x;
          let newY = origEl.y;
          let newW = origEl.width;
          let newH = origEl.height;

          if (resizeHandle.includes("e")) newW = origEl.width + dx;
          if (resizeHandle.includes("w")) {
            newX = origEl.x + dx;
            newW = origEl.width - dx;
          }
          if (resizeHandle.includes("s")) newH = origEl.height + dy;
          if (resizeHandle.includes("n")) {
            newY = origEl.y + dy;
            newH = origEl.height - dy;
          }

          updateElement(origEl.id, { x: newX, y: newY, width: newW, height: newH });
          return;
        }

        // Moving
        if (dragStart && selectedElementIds.length > 0) {
          const dx = pos.x - dragStart.x;
          const dy = pos.y - dragStart.y;

          for (const id of selectedElementIds) {
            const el = elements.find((e) => e.id === id);
            if (el) {
              const updates: Partial<BaseElement> = {
                x: el.x + dx,
                y: el.y + dy,
              };
              if (el.type === "pencil" && el.points) {
                updates.points = el.points.map((p) => ({
                  x: p.x + dx,
                  y: p.y + dy,
                }));
              }
              updateElement(id, updates);
            }
          }
          setDragStart(pos);
        }
        return;
      }

      if (activeTool === "eraser") {
        const clickedElement = getElementAtPosition(pos.x, pos.y, elements);
        if (clickedElement) {
          deleteElement(clickedElement.id);
        }
        return;
      }

      if (activeTool === "pencil" && currentElementId) {
        const el = elements.find((e) => e.id === currentElementId);
        if (el && el.points) {
          updateElement(currentElementId, {
            points: [...el.points, pos],
          });
        }
        return;
      }

      if (
        ["rectangle", "diamond", "ellipse", "line", "arrow"].includes(activeTool) &&
        currentElementId &&
        dragStart
      ) {
        updateElement(currentElementId, {
          width: pos.x - dragStart.x,
          height: pos.y - dragStart.y,
        });
        return;
      }
    },
    [
      isPanning,
      panStart,
      isDrawing,
      activeTool,
      screenToCanvas,
      setCanvasState,
      resizeHandle,
      resizeOrigin,
      dragStart,
      selectedElementIds,
      elements,
      currentElementId,
      updateElement,
      deleteElement,
    ]
  );

  // Mouse up
  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      // Text tool: open editor on mouseUp to avoid immediate blur
      if (activeTool === "text" && dragStart && !textEditPos) {
        setTextEditPos(dragStart);
        setTextEditId(null);
        setDragStart(null);
        textJustOpened.current = true;
        setTimeout(() => {
          textInputRef.current?.focus();
          textJustOpened.current = false;
        }, 50);
        return;
      }

      if (isDrawing || isPanning) {
        if (isDrawing && activeTool !== "select" && activeTool !== "eraser") {
          pushHistory();
        }
        if (isDrawing && activeTool === "select" && (dragStart || resizeHandle)) {
          pushHistory();
        }
        setIsDrawing(false);
        setIsPanning(false);
        setCurrentElementId(null);
        setDragStart(null);
        setPanStart(null);
        setResizeHandle(null);
        setResizeOrigin(null);
      }
    },
    [isDrawing, isPanning, activeTool, pushHistory, dragStart, resizeHandle, textEditPos]
  );

  // Wheel for zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      const newZoom = Math.min(Math.max(canvasState.zoom + delta, 0.1), 5);

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomRatio = newZoom / canvasState.zoom;
      const newOffsetX = mouseX - (mouseX - canvasState.offsetX) * zoomRatio;
      const newOffsetY = mouseY - (mouseY - canvasState.offsetY) * zoomRatio;

      setCanvasState({ zoom: newZoom, offsetX: newOffsetX, offsetY: newOffsetY });
    },
    [canvasState, setCanvasState]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in text input
      if (textEditPos) return;

      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          useStore.getState().redo();
        } else {
          useStore.getState().undo();
        }
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          useStore.getState().deleteSelectedElements();
        }
        return;
      }

      if (e.key === "Escape") {
        clearSelection();
        setTextEditPos(null);
        setActiveTool("select");
        return;
      }

      // Tool shortcuts
      const toolMap: Record<string, typeof activeTool> = {
        v: "select",
        h: "hand",
        p: "pencil",
        r: "rectangle",
        d: "diamond",
        o: "ellipse",
        a: "arrow",
        l: "line",
        t: "text",
        e: "eraser",
      };

      if (!e.metaKey && !e.ctrlKey && !e.altKey && toolMap[e.key]) {
        setActiveTool(toolMap[e.key]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementIds, clearSelection, setActiveTool, textEditPos]);

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      useStore.getState().saveToLocalStorage();
    }, 1000);
    return () => clearTimeout(timer);
  }, [elements]);

  // Load on mount
  useEffect(() => {
    useStore.getState().loadFromLocalStorage();
  }, []);

  // Double click to edit text
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const pos = screenToCanvas(e.clientX, e.clientY);
      const clickedElement = getElementAtPosition(pos.x, pos.y, elements);
      if (clickedElement && clickedElement.type === "text") {
        setTextEditPos({ x: clickedElement.x, y: clickedElement.y });
        setTextEditId(clickedElement.id);
        setTimeout(() => {
          if (textInputRef.current) {
            textInputRef.current.value = clickedElement.text || "";
            textInputRef.current.focus();
          }
        }, 50);
      }
    },
    [screenToCanvas, elements]
  );

  // Cursor based on tool
  const getCursor = () => {
    switch (activeTool) {
      case "hand":
        return isPanning ? "grabbing" : "grab";
      case "select":
        return "default";
      case "eraser":
        return "crosshair";
      case "text":
        return "text";
      default:
        return "crosshair";
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-white">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: getCursor() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      />

      {/* Text input overlay */}
      {textEditPos && (
        <textarea
          ref={textInputRef}
          className="absolute border-2 border-blue-400 bg-white/90 outline-none resize-both p-2 z-[100] rounded shadow-lg"
          style={{
            left: textEditPos.x * canvasState.zoom + canvasState.offsetX,
            top: textEditPos.y * canvasState.zoom + canvasState.offsetY,
            fontSize: 20 * canvasState.zoom,
            color: strokeColor,
            minWidth: 200,
            minHeight: 60,
            fontFamily: '"Segoe UI", system-ui, sans-serif',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Escape") {
              setTextEditPos(null);
              setTextEditId(null);
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleTextSubmit();
            }
          }}
          placeholder="Type here..."
        />
      )}

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 font-medium shadow-sm">
        {Math.round(canvasState.zoom * 100)}%
      </div>
    </div>
  );
}
