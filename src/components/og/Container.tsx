import type { PropsWithChildren } from "react";

export function Container({ children }: PropsWithChildren) {
  return (
    <div
      style={{
        fontSize: 48,
        background: "black",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Noto Serif",
        position: "relative",
      }}
    >
      {children}
    </div>
  );
}
