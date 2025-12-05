export const getNotoSerifItalicFont = async () => {
	const res = await fetch(
		new URL("@/assets/fonts/NotoSerif-Italic.ttf", import.meta.url),
	);
	return await res.arrayBuffer();
};
