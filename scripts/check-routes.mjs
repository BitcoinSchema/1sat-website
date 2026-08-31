#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const APP = join(ROOT, "app");
const SOURCE_ROOTS = ["app", "components", "providers", "lib"];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function routePatternFromFile(file) {
	const relativeFile = relative(APP, file).split(sep).join("/");
	const segments = relativeFile
		.replace(/\/(?:page|route)\.(?:[cm]?[jt]sx?)$/, "")
		.split("/")
		.filter((segment) => segment && !/^\(.+\)$/.test(segment))
		.filter((segment) => !segment.startsWith("@"));

	const parts = segments.map((segment) => {
		if (/^\[\[\.\.\..+\]\]$/.test(segment)) return ".*";
		if (/^\[\.\.\..+\]$/.test(segment)) return ".+";
		if (/^\[.+\]$/.test(segment)) return "[^/]+";
		return escapeRegex(segment);
	});

	if (!parts.length) return /^\/$/;
	return new RegExp(`^/${parts.join("/")}/?$`);
}

export function normalizeInternalTarget(value) {
	if (!value.startsWith("/") || value.startsWith("//")) return null;
	const pathname = value.split(/[?#]/, 1)[0];
	return pathname.replace(/\$\{[^}]+\}/g, "__dynamic__") || "/";
}

function walk(directory) {
	return readdirSync(directory).flatMap((entry) => {
		const path = join(directory, entry);
		return statSync(path).isDirectory() ? walk(path) : [path];
	});
}

function lineNumber(source, offset) {
	return source.slice(0, offset).split("\n").length;
}

function collectTargets(file) {
	const source = readFileSync(file, "utf8");
	const targets = [];
	const patterns = [
		/(?:href\s*=\s*\{?\s*|(?:push|replace|redirect)\(\s*)(["'`])(\/[^"'`]*?)\1/g,
		/\b(?:href|url)\s*:\s*(["'`])(\/[^"'`]*?)\1/g,
	];

	for (const pattern of patterns) {
		for (const match of source.matchAll(pattern)) {
			const target = normalizeInternalTarget(match[2]);
			if (target)
				targets.push({ target, line: lineNumber(source, match.index) });
		}
	}

	if (file === join(APP, "sitemap.ts")) {
		for (const match of source.matchAll(/`\$\{baseUrl\}(\/[^`]*)`/g)) {
			const target = normalizeInternalTarget(match[1]);
			if (target)
				targets.push({ target, line: lineNumber(source, match.index) });
		}
	}

	return targets;
}

export function findBrokenRoutes() {
	const routePatterns = walk(APP)
		.filter((file) => /\/(?:page|route)\.(?:[cm]?[jt]sx?)$/.test(file))
		.map(routePatternFromFile);
	const sourceFiles = SOURCE_ROOTS.flatMap((directory) =>
		walk(join(ROOT, directory)),
	).filter((file) => /\.[cm]?[jt]sx?$/.test(file));

	return sourceFiles.flatMap((file) =>
		collectTargets(file)
			.filter(({ target }) => {
				if (routePatterns.some((pattern) => pattern.test(target))) return false;
				const publicPath = join(ROOT, "public", target.slice(1));
				return !existsSync(publicPath) && !extname(target);
			})
			.map(({ target, line }) => ({
				file: relative(ROOT, file),
				line,
				target,
			})),
	);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const broken = findBrokenRoutes();
	if (broken.length) {
		console.error("Broken internal routes:");
		for (const item of broken) {
			console.error(`- ${item.file}:${item.line} -> ${item.target}`);
		}
		process.exitCode = 1;
	} else {
		console.log("Internal routes and sitemap entries resolve.");
	}
}
