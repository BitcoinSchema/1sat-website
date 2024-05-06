import type { ChangeEvent } from "react";

export type FileEvent = ChangeEvent<HTMLInputElement> & {
	target: EventTarget & { files: FileList };
};
