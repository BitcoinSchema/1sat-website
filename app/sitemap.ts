import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = "https://1satwallet.com";

	return [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 1,
		},
		{
			url: `${baseUrl}/inscribe`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
		{
			url: `${baseUrl}/activity`,
			lastModified: new Date(),
			changeFrequency: "always",
			priority: 0.7,
		},
		{
			url: `${baseUrl}/dashboard`,
			lastModified: new Date(),
			changeFrequency: "always",
			priority: 0.7,
		},
		{
			url: `${baseUrl}/market/ordinals`,
			lastModified: new Date(),
			changeFrequency: "hourly",
			priority: 0.7,
		},
		{
			url: `${baseUrl}/market/bsv21`,
			lastModified: new Date(),
			changeFrequency: "hourly",
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.6,
		},
		{
			url: `${baseUrl}/download`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.6,
		},
	];
}
