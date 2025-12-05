const cloudName = "tonicpow";

const normalizeSrc = (src: string) => (src[0] === "/" ? src.slice(1) : src);

export const cloudinaryLoader = ({
	src,
	width,
	quality,
}: {
	src: string;
	width: number;
	quality?: string;
}) => {
	const params = ["f_auto", "c_limit", `w_${width}`, `q_${quality || "auto"}`];
	return `https://res.cloudinary.com/${cloudName}/image/upload/${params.join(",")}/${normalizeSrc(src)}`;
};

export const cloudinaryFetchLoader = ({
	src,
	width,
	quality,
}: {
	src: string;
	width: number;
	quality?: string;
}) => {
	const params = ["f_auto", "c_limit", `w_${width}`, `q_${quality || "auto"}`];
	return `https://res.cloudinary.com/${cloudName}/fetch/${params.join(",")}/${normalizeSrc(src)}`;
};
