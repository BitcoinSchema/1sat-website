import DOMPurify from "dompurify";

export const sanitizeSVG = (svgContent: string): string => {
	const cleanSVG = DOMPurify.sanitize(svgContent, {
		USE_PROFILES: { svg: true },
	});
	return cleanSVG;
};
