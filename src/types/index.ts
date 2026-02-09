export type Tool =
  | "select"
  | "hand"
  | "pencil"
  | "rectangle"
  | "diamond"
  | "ellipse"
  | "arrow"
  | "line"
  | "text"
  | "eraser";

export type StrokeWidth = 1 | 2 | 4;

export interface Point {
  x: number;
  y: number;
}

export interface BaseElement {
  id: string;
  type: Tool;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  backgroundColor: string;
  strokeWidth: StrokeWidth;
  opacity: number;
  points?: Point[];
  text?: string;
  fontSize?: number;
  isSelected?: boolean;
}

export interface CanvasState {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

export interface HistoryEntry {
  elements: BaseElement[];
}
