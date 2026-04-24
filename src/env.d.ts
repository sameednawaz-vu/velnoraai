/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
	readonly PUBLIC_GA_ID?: string;
	readonly PUBLIC_GTM_ID?: string;
	readonly PUBLIC_IMAGE_CDN_BASE?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}