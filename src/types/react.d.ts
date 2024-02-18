/// <reference types="@google/model-viewer" />

export declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.AllHTMLAttributes<
          Partial<globalThis.HTMLElementTagNameMap['model-viewer']>
        >,
        Partial<globalThis.HTMLElementTagNameMap['model-viewer']>
      >;
    }
  }
}