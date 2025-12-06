interface Flip {
	horizontal: boolean;
	vertical: boolean;
}

interface PixelCrop {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface RotatedSize {
	width: number;
	height: number;
}

export const createImage = (url: string): Promise<HTMLImageElement> =>
	new Promise((resolve, reject) => {
		const image = new Image();
		image.addEventListener("load", () => resolve(image));
		image.addEventListener("error", (error) => reject(error));
		image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues on CodeSandbox
		image.src = url;
	});

export function getRadianAngle(degreeValue: number): number {
	return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(
	width: number,
	height: number,
	rotation: number,
): RotatedSize {
	const rotRad = getRadianAngle(rotation);

	return {
		width:
			Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
		height:
			Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
	};
}

/**
 * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
 */
export async function getCroppedImg(
	imageSrc: string,
	pixelCrop: PixelCrop,
	rotation = 0,
	flip: Flip = { horizontal: false, vertical: false },
	outputWidth = 400,
	outputHeight = 400,
): Promise<string | null> {
	const image = await createImage(imageSrc);
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");

	if (!ctx) {
		return null;
	}

	const rotRad = getRadianAngle(rotation);

	// calculate bounding box of the rotated image
	const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
		image.width,
		image.height,
		rotation,
	);

	// set canvas size to match the bounding box
	canvas.width = bBoxWidth;
	canvas.height = bBoxHeight;

	// translate canvas context to a central location to allow rotating and flipping around the center
	ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
	ctx.rotate(rotRad);
	ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
	ctx.translate(-image.width / 2, -image.height / 2);

	// draw rotated image
	ctx.drawImage(image, 0, 0);

	const croppedCanvas = document.createElement("canvas");
	const croppedCtx = croppedCanvas.getContext("2d");

	if (!croppedCtx) {
		return null;
	}

	// Set the desired output size
	croppedCanvas.width = outputWidth;
	croppedCanvas.height = outputHeight;

	// Draw the cropped image onto the new canvas, scaling it to output size
	croppedCtx.drawImage(
		canvas,
		pixelCrop.x,
		pixelCrop.y,
		pixelCrop.width,
		pixelCrop.height,
		0,
		0,
		outputWidth,
		outputHeight,
	);

	// Return the result as a blob URL
	return new Promise((resolve) => {
		croppedCanvas.toBlob((file) => {
			if (file) {
				resolve(URL.createObjectURL(file));
			}
		}, "image/png");
	});
}

export async function getRotatedImage(
	imageSrc: string,
	rotation = 0,
): Promise<string> {
	const image = await createImage(imageSrc);
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");

	if (!ctx) {
		throw new Error("Could not get canvas context");
	}

	const orientationChanged =
		rotation === 90 ||
		rotation === -90 ||
		rotation === 270 ||
		rotation === -270;
	if (orientationChanged) {
		canvas.width = image.height;
		canvas.height = image.width;
	} else {
		canvas.width = image.width;
		canvas.height = image.height;
	}

	ctx.translate(canvas.width / 2, canvas.height / 2);
	ctx.rotate((rotation * Math.PI) / 180);
	ctx.drawImage(image, -image.width / 2, -image.height / 2);

	return new Promise((resolve) => {
		canvas.toBlob((file) => {
			if (file) {
				resolve(URL.createObjectURL(file));
			}
		}, "image/png");
	});
}
