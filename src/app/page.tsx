"use client";

import dynamic from "next/dynamic";

const Canvas = dynamic(() => import("@/components/Canvas"), { ssr: false });
const Toolbar = dynamic(() => import("@/components/Toolbar"), { ssr: false });
const PropertiesPanel = dynamic(() => import("@/components/PropertiesPanel"), { ssr: false });
const ActionsMenu = dynamic(() => import("@/components/ActionsMenu"), { ssr: false });

export default function Home() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-white">
      <ActionsMenu />
      <Toolbar />
      <PropertiesPanel />
      <Canvas />
    </div>
  );
}
