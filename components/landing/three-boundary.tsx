"use client";

import { Component, type ReactNode } from "react";

// Decorative 3D must never take down the page — swallow render/runtime
// errors from the WebGL tree and render nothing instead.
export class ThreeBoundary extends Component<
	{ children: ReactNode; fallback?: ReactNode },
	{ failed: boolean }
> {
	state = { failed: false };

	static getDerivedStateFromError() {
		return { failed: true };
	}

	render() {
		if (this.state.failed) {
			return this.props.fallback ?? null;
		}
		return this.props.children;
	}
}
