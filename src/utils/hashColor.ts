import ColorHash from "color-hash";
const colorHash = new ColorHash();

export function hashColor(id: string) {
	const color = colorHash.rgb(id);
	return color.toString();
}
