export const readFileAsBase64 = (file: any): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => {
			const result = (reader?.result as string).split(",")[1];
			resolve(result);
		};
		reader.onerror = (error) => reject(error);
	});
};
