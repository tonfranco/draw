import { create } from "zustand";
import { BaseElement, CanvasState, HistoryEntry, StrokeWidth, Tool } from "@/types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

interface DrawStore {
  // Tool state
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;

  // Style state
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  strokeWidth: StrokeWidth;
  setStrokeWidth: (width: StrokeWidth) => void;
  opacity: number;
  setOpacity: (opacity: number) => void;

  // Elements
  elements: BaseElement[];
  setElements: (elements: BaseElement[]) => void;
  addElement: (element: Omit<BaseElement, "id">) => string;
  updateElement: (id: string, updates: Partial<BaseElement>) => void;
  deleteElement: (id: string) => void;
  deleteSelectedElements: () => void;
  selectedElementIds: string[];
  setSelectedElementIds: (ids: string[]) => void;
  clearSelection: () => void;

  // Canvas state
  canvasState: CanvasState;
  setCanvasState: (state: Partial<CanvasState>) => void;

  // History (undo/redo)
  history: HistoryEntry[];
  historyIndex: number;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Layers
  moveElementUp: (id: string) => void;
  moveElementDown: (id: string) => void;
  moveElementToTop: (id: string) => void;
  moveElementToBottom: (id: string) => void;

  // Persistence
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
  exportAsJSON: () => string;
  importFromJSON: (json: string) => void;
}

const STORAGE_KEY = "drawboard-data";

export const useStore = create<DrawStore>((set, get) => ({
  // Tool state
  activeTool: "select",
  setActiveTool: (tool) => set({ activeTool: tool }),

  // Style state
  strokeColor: "#1e1e1e",
  setStrokeColor: (color) => {
    set({ strokeColor: color });
    const { selectedElementIds, elements } = get();
    if (selectedElementIds.length > 0) {
      const updated = elements.map((el) =>
        selectedElementIds.includes(el.id) ? { ...el, strokeColor: color } : el
      );
      set({ elements: updated });
    }
  },
  backgroundColor: "transparent",
  setBackgroundColor: (color) => {
    set({ backgroundColor: color });
    const { selectedElementIds, elements } = get();
    if (selectedElementIds.length > 0) {
      const updated = elements.map((el) =>
        selectedElementIds.includes(el.id) ? { ...el, backgroundColor: color } : el
      );
      set({ elements: updated });
    }
  },
  strokeWidth: 2,
  setStrokeWidth: (width) => {
    set({ strokeWidth: width });
    const { selectedElementIds, elements } = get();
    if (selectedElementIds.length > 0) {
      const updated = elements.map((el) =>
        selectedElementIds.includes(el.id) ? { ...el, strokeWidth: width } : el
      );
      set({ elements: updated });
    }
  },
  opacity: 100,
  setOpacity: (opacity) => {
    set({ opacity });
    const { selectedElementIds, elements } = get();
    if (selectedElementIds.length > 0) {
      const updated = elements.map((el) =>
        selectedElementIds.includes(el.id) ? { ...el, opacity } : el
      );
      set({ elements: updated });
    }
  },

  // Elements
  elements: [],
  setElements: (elements) => set({ elements }),
  addElement: (element) => {
    const id = generateId();
    const newElement: BaseElement = { ...element, id };
    set((state) => ({ elements: [...state.elements, newElement] }));
    return id;
  },
  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  },
  deleteElement: (id) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementIds: state.selectedElementIds.filter((eid) => eid !== id),
    }));
  },
  deleteSelectedElements: () => {
    const { selectedElementIds } = get();
    set((state) => ({
      elements: state.elements.filter(
        (el) => !selectedElementIds.includes(el.id)
      ),
      selectedElementIds: [],
    }));
    get().pushHistory();
  },
  selectedElementIds: [],
  setSelectedElementIds: (ids) => set({ selectedElementIds: ids }),
  clearSelection: () => set({ selectedElementIds: [] }),

  // Canvas state
  canvasState: { offsetX: 0, offsetY: 0, zoom: 1 },
  setCanvasState: (state) =>
    set((prev) => ({
      canvasState: { ...prev.canvasState, ...state },
    })),

  // History
  history: [{ elements: [] }],
  historyIndex: 0,
  pushHistory: () => {
    const { elements, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ elements: JSON.parse(JSON.stringify(elements)) });
    if (newHistory.length > 100) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },
  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        historyIndex: newIndex,
        elements: JSON.parse(JSON.stringify(history[newIndex].elements)),
        selectedElementIds: [],
      });
    }
  },
  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        historyIndex: newIndex,
        elements: JSON.parse(JSON.stringify(history[newIndex].elements)),
        selectedElementIds: [],
      });
    }
  },

  // Layers
  moveElementUp: (id) => {
    set((state) => {
      const idx = state.elements.findIndex((el) => el.id === id);
      if (idx < state.elements.length - 1) {
        const newElements = [...state.elements];
        [newElements[idx], newElements[idx + 1]] = [newElements[idx + 1], newElements[idx]];
        return { elements: newElements };
      }
      return state;
    });
  },
  moveElementDown: (id) => {
    set((state) => {
      const idx = state.elements.findIndex((el) => el.id === id);
      if (idx > 0) {
        const newElements = [...state.elements];
        [newElements[idx], newElements[idx - 1]] = [newElements[idx - 1], newElements[idx]];
        return { elements: newElements };
      }
      return state;
    });
  },
  moveElementToTop: (id) => {
    set((state) => {
      const el = state.elements.find((e) => e.id === id);
      if (el) {
        return {
          elements: [
            ...state.elements.filter((e) => e.id !== id),
            el,
          ],
        };
      }
      return state;
    });
  },
  moveElementToBottom: (id) => {
    set((state) => {
      const el = state.elements.find((e) => e.id === id);
      if (el) {
        return {
          elements: [
            el,
            ...state.elements.filter((e) => e.id !== id),
          ],
        };
      }
      return state;
    });
  },

  // Persistence
  saveToLocalStorage: () => {
    const { elements } = get();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(elements));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  },
  loadFromLocalStorage: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const elements = JSON.parse(data) as BaseElement[];
        set({ elements, history: [{ elements: JSON.parse(data) }], historyIndex: 0 });
      }
    } catch (e) {
      console.error("Failed to load from localStorage", e);
    }
  },
  exportAsJSON: () => {
    const { elements } = get();
    return JSON.stringify(elements, null, 2);
  },
  importFromJSON: (json) => {
    try {
      const elements = JSON.parse(json) as BaseElement[];
      set({ elements });
      get().pushHistory();
    } catch (e) {
      console.error("Failed to import JSON", e);
    }
  },
}));
