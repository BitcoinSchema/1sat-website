import type { PropsWithChildren } from "react";

export function Container({ children }: PropsWithChildren) {
  return (
    <div
      style={{
        fontSize: 48,
        background: "black",
        color: "white",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Noto Serif",
        position: "relative",
        textTransform: "capitalize",
      }}
    >
      {children}
    </div>
  );
}
