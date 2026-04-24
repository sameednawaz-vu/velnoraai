/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect, useRef, type FormEvent } from "react";
import toolsData from "../../content/data/tools.json";
import catalog from "../../content/data/freeconvert-catalog.json";
import { blogPosts } from "../../content/data/blog-posts";

type IconProps = {
  size?: number;
  className?: string;
};

const ArrowRight = ({ size = 16, className }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const Sun = ({ size = 16, className }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const Moon = ({ size = 16, className }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 3a6.36 6.36 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const Search = ({ size = 16, className }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const X = ({ size = 16, className }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const ChevronRight = ({ size = 16, className }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

type ThemeMode = "dark" | "light";
type MegaKey = "tools" | "convert" | "compress";

type NavItem = {
  name: string;
  href: string;
  megaKey?: MegaKey;
};

type MegaTool = {
  label: string;
  href: string;
  hint: string;
};

type MegaGroup = {
  category: string;
  summary: string;
  browseHref: string;
  tools: MegaTool[];
};

type MegaMenu = {
  title: string;
  browseHref: string;
  groups: MegaGroup[];
};

type SearchEntry = {
  name: string;
  slug: string;
  href: string;
  typeLabel: "PRO" | "UTILITY" | "ARTICLE";
  context: string;
};

type SearchFilter = "tools" | "articles" | "both";
type NewsletterStatus = "idle" | "submitting" | "success" | "error";

const NAVIGATION_LINKS: NavItem[] = [
  { name: "Tools", href: "/tools", megaKey: "tools" },
  { name: "Convert", href: "/convert", megaKey: "convert" },
  { name: "Compress", href: "/compress", megaKey: "compress" },
  { name: "Blog", href: "/blog" },
];

const publishedTools = toolsData.tools.filter((tool) => tool.status === "published");

const utilityTools = catalog.surfaces.flatMap((surface) =>
  surface.groups.flatMap((group) =>
    group.tools.map((tool) => ({
      name: tool.name,
      slug: tool.slug,
      href: `/utility/${surface.slug}/${tool.slug}`,
      context: `${surface.name} / ${group.name}`,
      surfaceName: surface.name,
      groupName: group.name,
    }))
  )
);

const liveToolCount = publishedTools.length + utilityTools.length;
const liveCategoryCount =
  toolsData.categories.length + catalog.surfaces.reduce((count, surface) => count + surface.groups.length, 0);

const getSurface = (slug: string) => catalog.surfaces.find((surface) => surface.slug === slug);

const toHubSlug = (groupSlug: string) => {
  if (groupSlug.includes("image")) return "images";
  if (groupSlug.includes("video") || groupSlug.includes("audio")) return "video-audio";
  if (groupSlug.includes("gif")) return "gif";
  if (groupSlug.includes("pdf") || groupSlug.includes("document")) return "pdf";
  return groupSlug;
};

const toolsMegaGroups: MegaGroup[] = toolsData.categories
  .map((category) => {
    const categoryTools = publishedTools.filter((tool) => tool.category === category.slug);
    if (categoryTools.length === 0) {
      return null;
    }

    return {
      category: category.name,
      summary: `${categoryTools.length} pages`,
      browseHref: `/tools/${category.slug}`,
      tools: categoryTools.slice(0, 12).map((tool) => ({
        label: tool.name,
        href: `/tools/${tool.category}/${tool.slug}`,
        hint: "Professional tool",
      })),
    };
  })
  .filter((entry): entry is MegaGroup => Boolean(entry));

const buildSurfaceMegaGroups = (surfaceSlug: string): MegaGroup[] => {
  const surface = getSurface(surfaceSlug);
  if (!surface) {
    return [];
  }

  return surface.groups.map((group) => ({
    category: group.name,
    summary: `${group.tools.length} routes`,
    browseHref: `/utility/${toHubSlug(group.slug)}`,
    tools: group.tools.slice(0, 12).map((tool) => ({
      label: tool.name,
      href: `/utility/${surface.slug}/${tool.slug}`,
      hint: `${surface.name} route`,
    })),
  }));
};

const megaMenus: Record<MegaKey, MegaMenu> = {
  tools: {
    title: "Professional Tool Index",
    browseHref: "/tools",
    groups: toolsMegaGroups,
  },
  convert: {
    title: "Convert Route Index",
    browseHref: "/convert",
    groups: buildSurfaceMegaGroups("convert"),
  },
  compress: {
    title: "Compress Route Index",
    browseHref: "/compress",
    groups: buildSurfaceMegaGroups("compress"),
  },
};

const buildSearchIndex = (): SearchEntry[] => [
  ...publishedTools.map((tool) => ({
    name: tool.name,
    slug: tool.slug,
    href: `/tools/${tool.category}/${tool.slug}`,
    typeLabel: "PRO" as const,
    context: toolsData.categories.find((entry) => entry.slug === tool.category)?.name ?? tool.category,
  })),
  ...utilityTools.map((tool) => ({
    name: tool.name,
    slug: tool.slug,
    href: tool.href,
    typeLabel: "UTILITY" as const,
    context: tool.context,
  })),
  ...blogPosts.map((post) => ({
    name: post.title,
    slug: post.slug,
    href: `/blog/${post.slug}`,
    typeLabel: "ARTICLE" as const,
    context: `Blog / ${post.category}`,
  })),
];

const QUICK_SEARCHES = [
  "MP4 to GIF",
  "MP4 to MP3",
  "PDF Compressor",
  "WebP to PNG",
  "JSON Formatter",
  "Image Compressor",
  "Video to MP3",
  "ROI Calculator",
];

const STATS = [
  { value: `${liveToolCount}`, label: "Free tools" },
  { value: `${liveCategoryCount}`, label: "Categories" },
  { value: `${blogPosts.length}`, label: "Blog posts" },
];

const MARQUEE_ITEMS = [
  ...publishedTools.slice(0, 8).map((tool) => ({
    name: tool.name,
    href: `/tools/${tool.category}/${tool.slug}`,
  })),
  ...utilityTools.filter((entry) => entry.name.toLowerCase().includes("mp4")).slice(0, 6).map((entry) => ({
    name: entry.name,
    href: entry.href,
  })),
].slice(0, 12);

const CATEGORIES = [
  { id: "01", name: "Writing & Messaging", count: "15 tools", href: "/tools/writing-messaging" },
  { id: "02", name: "SEO & Content Ops", count: "15 tools", href: "/tools/seo-content-ops" },
  { id: "03", name: "Developer Tools", count: "30 tools", href: "/tools/developer-data-core" },
  { id: "04", name: "Business & Finance", count: "15 tools", href: "/tools/business-finance" },
  { id: "05", name: "Convert & Compress", count: "26 tools", href: "/utility-tools" },
  { id: "06", name: "Design, UX & Brand", count: "15 tools", href: "/tools/design-ux-brand" },
  { id: "07", name: "Productivity & Planning", count: "15 tools", href: "/tools/productivity-planning" },
  { id: "08", name: "Education & Learning", count: "15 tools", href: "/tools/education-team-communication" },
];

const POPULAR_TOOLS = [
  { name: "SEO Title Optimizer", tag: "SEO", desc: "Optimize page titles for higher click-through in search results.", href: "/tools/seo-content-ops/seo-title-optimizer" },
  { name: "MP4 to GIF", tag: "Convert", desc: "Convert any MP4 clip to a loopable GIF, in-browser.", href: "/utility/convert/mp4-to-gif" },
  { name: "JSON Formatter", tag: "Dev", desc: "Validate and beautify any JSON payload instantly.", href: "/tools/developer-data-core/json-formatter-validator" },
  { name: "PDF Compressor", tag: "Compress", desc: "Reduce PDF size without losing visible quality.", href: "/utility/compress/pdf-compressor" },
  { name: "ROI Calculator", tag: "Finance", desc: "Calculate return on investment for any campaign or spend.", href: "/tools/business-finance/roi-calculator" },
  { name: "Image Compressor", tag: "Compress", desc: "Compress JPG, PNG, WebP with live before/after preview.", href: "/utility/compress/image-compressor" },
];

const BLOG_HIGHLIGHTS = blogPosts.slice(0, 3).map((post) => ({
  title: post.title,
  category: post.category,
  date: new Date(post.publishedDate).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  }),
  href: `/blog/${post.slug}`,
}));

export default function DesignOnly2Home() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [openMegaKey, setOpenMegaKey] = useState<MegaKey | null>(null);
  const [megaMenuOffsetX, setMegaMenuOffsetX] = useState(0);
  const [activeMegaCategory, setActiveMegaCategory] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [canAnimate, setCanAnimate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("tools");
  const [searchIndex, setSearchIndex] = useState<SearchEntry[]>([]);
  const [isSearchIndexReady, setIsSearchIndexReady] = useState(false);
  const [isSearchIndexing, setIsSearchIndexing] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<NewsletterStatus>("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const megaCloseTimerRef = useRef<number | null>(null);
  const newsletterEndpoint = (import.meta.env.PUBLIC_NEWSLETTER_ENDPOINT ?? "").trim();

  const clearMegaCloseTimer = () => {
    if (megaCloseTimerRef.current !== null) {
      window.clearTimeout(megaCloseTimerRef.current);
      megaCloseTimerRef.current = null;
    }
  };

  const openMegaMenu = (key: MegaKey) => {
    clearMegaCloseTimer();
    setOpenMegaKey(key);
  };

  const scheduleMegaMenuClose = () => {
    clearMegaCloseTimer();
    megaCloseTimerRef.current = window.setTimeout(() => {
      setOpenMegaKey(null);
      megaCloseTimerRef.current = null;
    }, 150);
  };

  useEffect(() => {
    const saved = window.localStorage.getItem("velnora-theme");
    if (saved === "dark" || saved === "light") {
      setTheme(saved);
    }

    setCanAnimate(true);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("velnora-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen || isSearchIndexReady || isSearchIndexing) {
      return;
    }

    setIsSearchIndexing(true);
    let cancelled = false;

    const frameId = window.requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }

      setSearchIndex(buildSearchIndex());
      setIsSearchIndexReady(true);
      setIsSearchIndexing(false);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [isSearchOpen, isSearchIndexReady, isSearchIndexing]);

  useEffect(() => {
    setActiveMegaCategory(0);
  }, [openMegaKey]);

  useEffect(() => {
    if (!openMegaKey) {
      setMegaMenuOffsetX(0);
      return;
    }

    let frameId = 0;

    const updateMegaPlacement = () => {
      const panel = megaMenuRef.current;
      if (!panel) {
        return;
      }

      setMegaMenuOffsetX(0);

      frameId = window.requestAnimationFrame(() => {
        const viewportPadding = 16;
        const rect = panel.getBoundingClientRect();
        let nextOffset = 0;

        if (rect.right > window.innerWidth - viewportPadding) {
          nextOffset -= rect.right - (window.innerWidth - viewportPadding);
        }

        if (rect.left + nextOffset < viewportPadding) {
          nextOffset += viewportPadding - (rect.left + nextOffset);
        }

        setMegaMenuOffsetX(Math.round(nextOffset));
      });
    };

    updateMegaPlacement();
    window.addEventListener("resize", updateMegaPlacement);

    return () => {
      window.removeEventListener("resize", updateMegaPlacement);
      window.cancelAnimationFrame(frameId);
    };
  }, [openMegaKey, activeMegaCategory]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target;
      const isInputTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;

      if (event.key === "Escape" && isSearchOpen) {
        event.preventDefault();
        setIsSearchOpen(false);
        return;
      }

      if (isInputTarget && !isSearchOpen) {
        return;
      }

      if (event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isSearchOpen]);

  useEffect(() => {
    return () => {
      clearMegaCloseTimer();
    };
  }, []);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const normalize = (value: string) =>
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const inOrderMatch = (text: string, query: string) => {
    let cursor = 0;
    for (const char of query) {
      cursor = text.indexOf(char, cursor);
      if (cursor === -1) {
        return false;
      }
      cursor += 1;
    }
    return true;
  };

  const scoreEntry = (entry: SearchEntry, query: string, tokens: string[]) => {
    const name = normalize(entry.name);
    const slug = normalize(entry.slug);
    const context = normalize(entry.context);
    const typeLabel =
      entry.typeLabel === "PRO" ? "professional tool" : entry.typeLabel === "UTILITY" ? "utility route" : "blog article";
    const keywords = `${name} ${slug} ${context} ${typeLabel}`;

    let score = 0;
    if (name.startsWith(query)) score += 130;
    if (slug.startsWith(query)) score += 120;
    if (name.includes(query)) score += 92;
    if (slug.includes(query)) score += 88;
    if (keywords.includes(query)) score += 64;
    if (inOrderMatch(`${name} ${slug}`, query)) score += 44;

    for (const token of tokens) {
      if (!token) continue;
      if (name.startsWith(token)) score += 42;
      if (slug.startsWith(token)) score += 38;
      if (keywords.includes(token)) score += 24;
    }

    if (keywords.split(" ").filter(Boolean).some((token) => token.startsWith(query))) {
      score += 28;
    }

    return score;
  };

  const searchResults = useMemo(() => {
    const query = normalize(searchQuery);
    const tokens = query.split(" ").filter(Boolean);

    if (!isSearchIndexReady || query.length < 2) {
      return [] as Array<{ entry: SearchEntry; score: number }>;
    }

    return searchIndex
      .filter((entry) => {
        if (searchFilter === "tools") {
          return entry.typeLabel !== "ARTICLE";
        }

        if (searchFilter === "articles") {
          return entry.typeLabel === "ARTICLE";
        }

        return true;
      })
      .map((entry) => ({ entry, score: scoreEntry(entry, query, tokens) }))
      .filter((entry) => entry.score > 0)
      .sort((first, second) => second.score - first.score)
      .slice(0, 60);
  }, [searchQuery, searchFilter, searchIndex, isSearchIndexReady]);

  const hasActiveQuery = searchQuery.trim().length >= 2;

  const activeMenu = openMegaKey ? megaMenus[openMegaKey] : null;
  const activeGroup = activeMenu?.groups[activeMegaCategory];

  const confidenceLabel = (score: number) => {
    if (score >= 300) return "High confidence";
    if (score >= 220) return "Strong candidate";
    return "Related result";
  };

  const openQuickSearch = (value: string) => {
    setSearchQuery(value);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const resultTitle =
    isSearchIndexing
      ? "Indexing search data..."
      : searchQuery.trim().length < 2
      ? "Type at least 2 characters"
      : searchResults.length > 0
        ? `${searchFilter === "articles" ? "Top article matches" : searchFilter === "tools" ? "Top tool matches" : "Top matches"} (${searchResults.length})`
        : "No matches yet";

  const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = newsletterEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setNewsletterStatus("error");
      setNewsletterMessage("Enter a valid email address to subscribe.");
      return;
    }

    setNewsletterStatus("submitting");
    setNewsletterMessage("Submitting...");

    try {
      let remoteSaved = false;

      if (newsletterEndpoint) {
        try {
          const response = await fetch(newsletterEndpoint, {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              email,
              source: "home-intelligence-list",
              submittedAt: new Date().toISOString(),
            }),
          });

          remoteSaved = response.ok;
        } catch {
          remoteSaved = false;
        }
      }

      const storageKey = "velnora-newsletter-signups";
      const existingRaw = window.localStorage.getItem(storageKey);
      const existingData = existingRaw ? JSON.parse(existingRaw) : [];
      const safeData = Array.isArray(existingData) ? existingData : [];

      if (!safeData.some((entry) => typeof entry?.email === "string" && entry.email === email)) {
        safeData.push({
          email,
          addedAt: new Date().toISOString(),
          source: "home-intelligence-list",
        });
      }

      window.localStorage.setItem(storageKey, JSON.stringify(safeData));
      setNewsletterEmail("");
      setNewsletterStatus("success");
      setNewsletterMessage(
        remoteSaved || !newsletterEndpoint
          ? "Subscription received. We will send product updates to your inbox."
          : "Subscription saved on this device. Cloud sync is temporarily unavailable."
      );
    } catch {
      setNewsletterStatus("error");
      setNewsletterMessage("Subscription could not be saved. Contact sameednawaz1@gmail.com directly.");
    }
  };

  return (
    <div className="design-only-two-home min-h-screen relative selection:bg-gold selection:text-app-bg flex flex-col transition-colors duration-500 bg-app-bg text-app-text font-sans">
      {/* Search Overlay */}
      {canAnimate && (
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-app-bg/95 backdrop-blur-md flex flex-col px-4 md:px-[60px] pt-6 md:pt-10 overflow-y-auto"
            >
            <div className="flex justify-between items-center mb-10 md:mb-20 transition-colors duration-500">
              <span className={`font-display text-gold text-lg tracking-widest uppercase ${theme === "dark" ? "opacity-90" : "opacity-70"}`}>
                Intelligence Search
              </span>
              <button 
                onClick={() => setIsSearchOpen(false)}
                className={`p-3 border rounded-full transition-colors cursor-pointer ${theme === "dark" ? "border-gold/55 bg-app-card-bg/[0.18] hover:border-gold hover:bg-gold/[0.1]" : "border-app-sep bg-app-card-bg/[0.12] hover:border-gold"}`}
              >
                <X size={24} className="text-gold" />
              </button>
            </div>
              <div className="max-w-5xl w-full mx-auto">
              <div className="border-b-2 border-gold/30 pb-4 flex items-center gap-6 group focus-within:border-gold transition-colors">
                <Search size={32} className="text-gold opacity-80 group-focus-within:opacity-100 transition-opacity" />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && searchResults.length > 0) {
                      window.location.href = searchResults[0].entry.href;
                    }
                  }}
                  placeholder="SEARCH TOOLS OR ARTICLES (E.G. MP4 TO GIF, COMPRESS PDF, QA CHECKLIST)"
                    className={`bg-transparent border-none outline-none text-2xl sm:text-3xl md:text-4xl font-display w-full uppercase tracking-tight py-2 text-app-text ${theme === "dark" ? "placeholder:opacity-55" : "placeholder:opacity-35"}`}
                />
              </div>
              {!hasActiveQuery && (
                <div className="mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 border-t border-app-sep pt-8 md:pt-10">
                  <div className="md:border-r md:border-app-sep md:pr-20">
                    <h4 className="text-[11px] uppercase tracking-[0.3em] text-gold mb-8 opacity-60">Trending Searches</h4>
                    <div className="flex flex-col gap-4 text-app-text">
                      {QUICK_SEARCHES.map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => openQuickSearch(s)}
                          className={`text-xl font-display text-left hover:text-gold transition-colors hover:opacity-100 italic ${theme === "dark" ? "opacity-85" : "opacity-60"}`}
                        >
                          {s} —
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[11px] uppercase tracking-[0.3em] text-gold mb-8 opacity-60">Search Logic</h4>
                    <p className={`text-[13px] leading-relaxed font-light text-app-text italic ${theme === "dark" ? "opacity-85" : "opacity-70"}`}>
                      Our real-time engine parses {liveToolCount}+ tool routes. Type the action (e.g., "compress") or file format (e.g., "mp4") to pull all related routes.
                    </p>
                    <div className="mt-12 p-8 border border-gold/10 bg-gold/[0.02]">
                      <span className="text-[9px] uppercase tracking-[0.4em] text-gold block mb-2 font-bold">Lab Note</span>
                      <span className={`text-[12px] font-light text-app-text ${theme === "dark" ? "opacity-85" : "opacity-70"}`}>
                        Search results are processed entirely client-side. Zero latency. Zero tracking.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 border border-app-sep rounded-sm p-6 bg-app-card-bg/[0.03]">
                <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                  <div className={`text-[10px] uppercase tracking-[0.22em] text-app-text ${theme === "dark" ? "opacity-80" : "opacity-60"}`}>
                    {resultTitle}
                  </div>
                  <div className="inline-flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSearchFilter("tools")}
                      className={`px-3 min-h-[30px] border uppercase tracking-[0.16em] text-[10px] transition-colors ${searchFilter === "tools" ? "border-gold bg-gold/[0.16] text-gold" : "border-app-sep text-app-text opacity-80 hover:opacity-100 hover:border-gold/50"}`}
                    >
                      Tools
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchFilter("articles")}
                      className={`px-3 min-h-[30px] border uppercase tracking-[0.16em] text-[10px] transition-colors ${searchFilter === "articles" ? "border-gold bg-gold/[0.16] text-gold" : "border-app-sep text-app-text opacity-80 hover:opacity-100 hover:border-gold/50"}`}
                    >
                      Articles
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchFilter("both")}
                      className={`px-3 min-h-[30px] border uppercase tracking-[0.16em] text-[10px] transition-colors ${searchFilter === "both" ? "border-gold bg-gold/[0.16] text-gold" : "border-app-sep text-app-text opacity-80 hover:opacity-100 hover:border-gold/50"}`}
                    >
                      Both
                    </button>
                  </div>
                </div>

                {searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                  <p className={`text-[14px] ${theme === "dark" ? "opacity-80" : "opacity-65"}`}>
                    {isSearchIndexing
                      ? "Preparing search index..."
                      : `No direct ${searchFilter === "articles" ? "article" : searchFilter === "tools" ? "tool" : "result"} match for "${searchQuery}". Try a shorter phrase.`}
                  </p>
                )}

                {searchQuery.trim().length < 2 && (
                  <p className={`text-[14px] ${theme === "dark" ? "opacity-80" : "opacity-65"}`}>
                    Try "mp4", "pdf", "compress", "json", or "qa checklist".
                  </p>
                )}

                {searchResults.length > 0 && (
                  <ul className="grid gap-2 max-h-[52vh] overflow-y-auto pr-2">
                    {searchResults.map((result, index) => (
                      <li key={`${result.entry.href}-${index}`}>
                        <a
                          href={result.entry.href}
                          className="block border border-app-sep hover:border-gold/50 hover:bg-gold/[0.05] transition-colors p-4"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] uppercase tracking-widest opacity-50">#{index + 1}</span>
                            <span className="text-[10px] uppercase tracking-widest border border-app-sep px-2 py-0.5 opacity-70">
                              {result.entry.typeLabel}
                            </span>
                            <strong className="font-display text-[18px] leading-none">{result.entry.name}</strong>
                          </div>
                          <div className="text-[12px] opacity-75">{result.entry.context}</div>
                          <div className="text-[11px] opacity-70 mt-1">{result.entry.href}</div>
                          <div className="text-[10px] uppercase tracking-widest text-gold/70 mt-2">
                            {confidenceLabel(result.score)}
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between px-4 md:px-[60px] py-4 md:py-10 border-b border-app-sep relative z-[80] bg-app-bg transition-colors duration-500 gap-3 md:gap-0">
        <a href="/" className="flex items-center gap-3 text-gold">
          <img src="/images/favicon-velnora.svg" width={24} height={24} alt="Velnora" className="w-6 h-6" />
          <span className="font-display text-[1rem] md:text-[1.2rem] tracking-[0.1em] uppercase">Velnora</span>
        </a>
        <nav className="w-full md:w-auto flex items-center gap-3 md:gap-8 text-[10px] md:text-[12px] uppercase tracking-[0.12em] md:tracking-[0.15em] text-app-text overflow-x-auto md:overflow-visible pb-1 md:pb-0">
          {NAVIGATION_LINKS.map(link => (
            <div 
              key={link.name} 
              onMouseEnter={() => link.megaKey && openMegaMenu(link.megaKey)}
              onMouseLeave={() => link.megaKey && scheduleMegaMenuClose()}
              className="relative"
            >
              <a href={link.href} className={`hover:text-gold transition-colors cursor-pointer py-2 md:py-4 inline-block whitespace-nowrap ${link.megaKey && openMegaKey === link.megaKey ? "text-gold" : ""}`}>
                {link.name}
              </a>

              {/* Mega Menu Overlay */}
              {canAnimate && link.megaKey && activeMenu && openMegaKey === link.megaKey && (
                <AnimatePresence>
                  {activeGroup && (
                    <motion.div
                      ref={megaMenuRef}
                      onMouseEnter={clearMegaCloseTimer}
                      onMouseLeave={scheduleMegaMenuClose}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 right-auto top-full pt-4 z-[120] w-[min(860px,calc(100vw-2rem))]"
                      style={megaMenuOffsetX === 0 ? undefined : { marginLeft: `${megaMenuOffsetX}px` }}
                    >
                      <div className="absolute left-0 right-0 -top-4 h-4" aria-hidden="true" />
                      <div className="bg-[rgb(var(--app-bg-rgb))] border border-app-sep shadow-2xl p-1 shadow-gold/5 flex min-h-[420px]">
                        {/* Column 1: Categories */}
                        <div className="w-[300px] border-r border-app-sep">
                          {activeMenu.groups.map((item, i) => (
                            <button
                              key={item.category}
                              onMouseEnter={() => setActiveMegaCategory(i)}
                              className={`w-full bg-transparent text-left px-8 py-6 text-[11px] uppercase tracking-[0.2em] flex items-center justify-between border-b border-app-sep/50 last:border-b-0 transition-all ${activeMegaCategory === i ? 'bg-gold/[0.12] text-gold pl-10' : 'text-app-text/85 hover:bg-gold/[0.05] hover:text-gold hover:pl-10'}`}
                            >
                              {item.category}
                              <ChevronRight size={12} className={activeMegaCategory === i ? 'opacity-100' : 'opacity-25'} />
                            </button>
                          ))}
                        </div>
                        {/* Column 2: Specific Tools */}
                        <div className="flex-1 p-10 bg-gold/[0.02]">
                          <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-8 font-bold opacity-60">
                             {activeMenu.title} / {activeGroup.category}
                          </div>
                          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                            {activeGroup.tools.map((tool) => (
                              <a key={tool.label} href={tool.href} className="text-left group flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-gold/20 rounded-full group-hover:bg-gold transition-colors" />
                                <div className="grid gap-0.5">
                                  <span className="text-[14px] font-display italic opacity-85 group-hover:opacity-100 group-hover:text-gold transition-all group-hover:translate-x-1 text-app-text">
                                    {tool.label}
                                  </span>
                                  <span className="text-[10px] uppercase tracking-[0.12em] opacity-60 group-hover:opacity-80 text-app-text">
                                    {tool.hint}
                                  </span>
                                </div>
                              </a>
                            ))}
                          </div>
                          <div className="mt-16 pt-8 border-t border-app-sep flex items-center justify-between">
                             <span className="text-[10px] uppercase tracking-widest opacity-55 text-app-text">Selection Vertical Intelligence</span>
                             <a href={activeGroup.browseHref} className="text-[11px] text-gold uppercase tracking-[0.2em] font-bold border-b border-gold/40 hover:opacity-70 transition-opacity">Browse Segment →</a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          ))}

          <button 
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search tools"
            title="Search tools"
            className={`p-2 md:p-2.5 border rounded-full transition-all cursor-pointer shrink-0 ${theme === "dark" ? "border-gold/55 bg-app-card-bg/[0.2] text-gold hover:border-gold hover:bg-gold/[0.14]" : "border-gold/30 bg-app-card-bg/[0.16] text-app-text hover:border-gold hover:bg-gold/[0.1] hover:text-gold"}`}
          >
            <Search size={18} />
          </button>
          
          <button 
            onClick={toggleTheme}
            className="p-2 bg-app-card-bg/[0.16] border border-gold/30 rounded-full hover:border-gold transition-all cursor-pointer text-gold flex items-center justify-center overflow-hidden shrink-0"
            aria-label="Toggle Theme"
          >
            <span className={`inline-flex transition-transform duration-300 ${theme === "dark" ? "rotate-0" : "rotate-180"}`}>
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            </span>
          </button>

          <a href="/tools" className="bg-gold text-obsidian px-3 md:px-5 py-2 font-bold tracking-[0.12em] md:tracking-widest text-[10px] md:text-[12px] hover:opacity-90 transition-opacity cursor-pointer inline-block whitespace-nowrap ml-auto md:ml-0">
            Open workspace
          </a>
        </nav>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-[60%_40%] px-4 md:px-[60px] pt-8 md:pt-[60px] pb-14 md:pb-20 gap-8 md:gap-0">
          <div className="flex flex-col justify-center pr-0 md:pr-10">
            <h1 className="font-display text-[42px] sm:text-[56px] md:text-[72px] leading-[1.06] md:leading-[1.05] font-normal max-w-[540px]">
              The next generation of high-end tools is <em className="italic text-gold">already here.</em>
            </h1>
            <p className="mt-6 md:mt-8 text-[13px] md:text-[14px] leading-relaxed max-w-md opacity-60 font-light italic">
              165 free professional utility tools. Convert, compress, and build in your browser. Secure, fast, and entirely client-side.
            </p>
            <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <a href="/tools#all-tools-directory" className="bg-text text-app-bg px-8 py-3.5 font-bold tracking-[0.1em] uppercase text-[12px] hover:bg-gold transition-colors cursor-pointer inline-block">
                Browse the Index
              </a>
              <a href="/utility-tools" className="text-[12px] uppercase tracking-[0.2em] opacity-60 hover:opacity-100 transition-opacity cursor-pointer border-b border-gold/40 pb-1 inline-block">
                View All Categories →
              </a>
            </div>
          </div>

          <div className="border-t md:border-t-0 md:border-l border-gold/20 pt-4 md:pt-0 md:pl-[60px] flex flex-row md:flex-col gap-5 md:gap-0 justify-between">
            {STATS.map((stat, i) => (
              <div key={stat.label} className={`flex-1 md:flex-none py-3 md:py-5 ${i < STATS.length - 1 ? 'md:border-b md:border-app-sep' : ''}`}>
                <div className="h-px w-14 bg-gold/30 mb-3" />
                <span className="font-display text-[32px] md:text-[42px] text-gold block leading-none">
                  {stat.value}
                </span>
                <span className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] opacity-60 mt-1 block">
                  {stat.label}
                </span>
                <div className="h-px w-20 bg-gold/20 mt-3" />
              </div>
            ))}
          </div>
        </div>

        {/* Marquee Strip */}
        <div className="bg-gold text-obsidian py-3 overflow-hidden flex whitespace-nowrap border-y border-app-sep">
          <div className="animate-marquee will-change-transform flex items-center shrink-0">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <a key={`${item.href}-${i}`} href={item.href} className="px-10 text-[14px] font-bold uppercase tracking-[0.1em] hover:underline underline-offset-4">
                {item.name} •
              </a>
            ))}
          </div>
          <div className="animate-marquee will-change-transform flex items-center shrink-0">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <a key={`${item.href}-${i}-second`} href={item.href} className="px-10 text-[14px] font-bold uppercase tracking-[0.1em] hover:underline underline-offset-4">
                {item.name} •
              </a>
            ))}
          </div>
        </div>

        {/* Why Velnora Section */}
        <section className="px-4 md:px-[60px] py-16 md:py-32 border-b border-app-sep">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
            <div>
              <div className="text-gold text-[11px] uppercase tracking-[0.3em] font-bold mb-6">Manifesto</div>
              <h2 className="font-display text-[38px] md:text-[48px] leading-tight max-w-sm">
                Built for those who value <em className="italic text-gold opacity-80">privacy & speed.</em>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10 md:gap-y-16 pt-4 md:pt-12">
              <div>
                <div className="w-8 h-[1px] bg-gold mb-6" />
                <h3 className="text-[14px] font-bold uppercase tracking-widest mb-3 text-app-text">Client-Side First</h3>
                <p className="text-[13px] opacity-50 leading-relaxed font-light">
                  Your files never leave your machine. Processing happens entirely in your browser memory for maximum security.
                </p>
              </div>
              <div>
                <div className="w-8 h-[1px] bg-gold mb-6" />
                <h3 className="text-[14px] font-bold uppercase tracking-widest mb-3 text-app-text">Zero Accounts</h3>
                <p className="text-[13px] opacity-50 leading-relaxed font-light">
                  No sign-ups, no waitlists, no barriers. We believe utility should be immediate and frictionless.
                </p>
              </div>
              <div>
                <div className="w-8 h-[1px] bg-gold mb-6" />
                <h3 className="text-[14px] font-bold uppercase tracking-widest mb-3 text-app-text">Neutral Design</h3>
                <p className="text-[13px] opacity-50 leading-relaxed font-light">
                  A tool should be a silent partner. Our interface is designed to fade away so you can focus on the work.
                </p>
              </div>
              <div>
                <div className="w-8 h-[1px] bg-gold mb-6" />
                <h3 className="text-[14px] font-bold uppercase tracking-widest mb-3 text-app-text">Global Edge</h3>
                <p className="text-[13px] opacity-50 leading-relaxed font-light">
                  Static-first architecture served from worldwide edge nodes ensures zero-latency access from anywhere.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="px-4 md:px-[60px] py-16 md:py-24">
          <div className="mb-10 md:mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
            <h2 className="font-display text-[34px] md:text-[42px] font-normal tracking-tight">Browse strictly by vertical.</h2>
            <div className="text-[11px] uppercase tracking-[0.2em] opacity-40">Section 03 / Index Classification</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CATEGORIES.map(cat => (
              <a
                key={cat.id}
                href={cat.href}
                className="card group p-8 border border-app-sep bg-app-card-bg/[0.02] transition-all duration-300 cursor-pointer flex flex-col gap-4 hover:border-gold hover:bg-gold/[0.06]"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] opacity-30 tracking-[0.1em] transition-colors group-hover:text-gold uppercase text-app-text">
                    {cat.id}
                  </span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-gold" />
                </div>
                <span className="font-display text-[22px] opacity-90 group-hover:opacity-100 transition-opacity text-app-text">
                  {cat.name}
                </span>
                <span className="text-[10px] uppercase tracking-widest opacity-40 mt-auto text-app-text">
                  {cat.count}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Popular Tools Section */}
        <section className="px-4 md:px-[60px] py-16 md:py-24 bg-gold/[0.03]">
          <div className="mb-12 text-[11px] uppercase tracking-[0.2em] opacity-40 border-b border-app-sep pb-4 flex justify-between">
            <span>Current Popularity Index</span>
            <span>Real-time Usage Stats</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {POPULAR_TOOLS.map(tool => (
              <div key={tool.name} className="border border-app-sep p-8 group hover:border-gold/30 transition-colors bg-app-card-bg/[0.02]">
                <div className="flex justify-between items-start mb-6">
                  <span className="font-display text-[18px] opacity-80 group-hover:text-gold transition-colors text-app-text">{tool.name}</span>
                  <span className="text-[9px] uppercase tracking-widest opacity-50 border border-app-sep px-2 py-0.5 text-app-text">{tool.tag}</span>
                </div>
                <p className="text-[13px] opacity-70 leading-relaxed font-light mb-auto min-h-[40px] text-app-text">
                  {tool.desc}
                </p>
                <div className="mt-8 pt-6 border-t border-app-sep flex justify-end">
                   <a href={tool.href} className="text-[11px] uppercase tracking-widest text-gold/70 group-hover:text-gold transition-colors">Launch Tool</a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Blog Section */}
        <section className="px-4 md:px-[60px] py-16 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-10 md:gap-20">
            <div>
              <div className="text-gold text-[11px] uppercase tracking-[0.3em] font-bold mb-6">Blog</div>
              <h2 className="font-display text-[30px] md:text-[36px] leading-tight mb-8">
                Thinking deeper about <em className="italic not-italic text-gold opacity-80">digital craft.</em>
              </h2>
              <a href="/blog" className="text-[12px] uppercase tracking-[0.2em] opacity-60 hover:opacity-100 transition-opacity cursor-pointer border-b border-gold/40 pb-1 inline-block">
                Explore Blog →
              </a>
            </div>
            <div className="flex flex-col gap-px bg-app-sep border border-app-sep">
              {BLOG_HIGHLIGHTS.map((article, i) => (
                <a key={i} href={article.href} className="bg-app-bg p-6 md:p-10 group cursor-pointer hover:bg-gold/[0.02] transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-gold/60">{article.category}</span>
                    <h4 className="font-display text-[20px] md:text-[24px] group-hover:text-gold transition-colors">{article.title}</h4>
                    <span className="text-[11px] opacity-30">{article.date}</span>
                  </div>
                  <ArrowRight size={24} className="opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all text-gold" />
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="px-4 md:px-[60px] py-16 md:py-32 border-t border-app-sep text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-[40px] sm:text-[46px] md:text-[56px] leading-tight mb-8">
              Join the <em className="italic not-italic text-gold opacity-80">Intelligence List.</em>
            </h2>
            <p className={`text-[14px] leading-relaxed mb-12 font-light ${theme === "dark" ? "opacity-85" : "opacity-70"}`}>
              Periodic updates on new tools, technical deep-dives into creative engineering, and news from the Velnora lab.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="grid gap-4 max-w-md mx-auto">
              <div className={`flex gap-2 border px-4 py-3 ${theme === "dark" ? "border-gold/45 bg-app-card-bg/[0.18]" : "border-gold/35 bg-app-card-bg/[0.12]"}`}>
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(event) => {
                    setNewsletterEmail(event.target.value);
                    if (newsletterStatus !== "idle") {
                      setNewsletterStatus("idle");
                      setNewsletterMessage("");
                    }
                  }}
                  placeholder="EMAIL ADDRESS"
                  className={`bg-transparent border-none outline-none text-[12px] uppercase tracking-widest w-full text-app-text ${theme === "dark" ? "placeholder:opacity-80" : "placeholder:opacity-60"}`}
                  aria-label="Email address"
                  required
                />
                <button
                  type="submit"
                  disabled={newsletterStatus === "submitting"}
                  className={`px-3 text-[12px] uppercase tracking-[0.2em] font-bold cursor-pointer disabled:opacity-40 border ${theme === "dark" ? "text-gold border-gold/55 bg-gold/[0.12] hover:bg-gold/[0.2]" : "text-app-text border-app-sep bg-app-card-bg/[0.3] hover:border-gold/50"}`}
                >
                  {newsletterStatus === "submitting" ? "Sending" : "Submit"}
                </button>
              </div>
              {newsletterMessage && (
                <p
                  className={`text-[11px] uppercase tracking-[0.14em] ${newsletterStatus === "success" ? "text-gold/90" : "text-app-text opacity-75"}`}
                >
                  {newsletterMessage}
                </p>
              )}
            </form>
          </div>
        </section>
      </main>

      {/* Large Footer */}
      <footer className="bg-app-bg border-t border-app-sep px-4 md:px-[60px] pt-16 md:pt-24 pb-10 md:pb-12 transition-colors duration-500">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-20 mb-16 md:mb-24">
          <div className="col-span-1">
            <div className="font-display text-[24px] tracking-[0.1em] uppercase text-gold mb-8">
              Velnora
            </div>
            <p className="text-[12px] opacity-40 leading-relaxed font-light mb-8 max-w-[200px]">
              A curated index of highly professional utility tools for the next generation of creative digital builders.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <a href="https://www.reddit.com/user/Velnoraai/" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-gold/60 hover:text-gold transition-colors underline underline-offset-4 decoration-gold/20">Reddit</a>
              <a href="https://www.facebook.com/profile.php?id=61588840100652" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-gold/60 hover:text-gold transition-colors underline underline-offset-4 decoration-gold/20">Facebook</a>
            </div>
          </div>

          <div>
            <h5 className="text-[11px] uppercase tracking-[0.3em] font-bold text-gold mb-10 opacity-60">Directory</h5>
            <div className="flex flex-col gap-4 text-[13px] opacity-40">
              <a href="/tools" className="hover:text-gold transition-colors">Browse Tools</a>
              <a href="/tools" className="hover:text-gold transition-colors">Featured Categories</a>
              <a href="/utility-tools" className="hover:text-gold transition-colors">Popular Engines</a>
              <a href="/utility-tools" className="hover:text-gold transition-colors">All Utilities</a>
            </div>
          </div>

          <div>
            <h5 className="text-[11px] uppercase tracking-[0.3em] font-bold text-gold mb-10 opacity-60">Insight</h5>
            <div className="flex flex-col gap-4 text-[13px] opacity-40">
              <a href="/blog" className="hover:text-gold transition-colors">Technical Blog</a>
              <a href="/learning-hub" className="hover:text-gold transition-colors">Learning Hub</a>
              <a href="/library" className="hover:text-gold transition-colors">Library</a>
              <a href="/tools" className="hover:text-gold transition-colors">Tool Updates</a>
            </div>
          </div>

          <div>
            <h5 className="text-[11px] uppercase tracking-[0.3em] font-bold text-gold mb-10 opacity-60">Company</h5>
            <div className="flex flex-col gap-4 text-[13px] opacity-40">
              <a href="/about" className="hover:text-gold transition-colors">About</a>
              <a href="/privacy-policy" className="hover:text-gold transition-colors">Privacy Policy</a>
              <a href="/contact" className="hover:text-gold transition-colors">Contact</a>
              <a href="mailto:sameednawaz1@gmail.com" className="hover:text-gold transition-colors lowercase">sameednawaz1@gmail.com</a>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0 pt-8 md:pt-12 border-t border-app-sep text-center md:text-left">
          <div className="text-[10px] tracking-[0.2em] uppercase opacity-30">
            © 2026 Velnora Laboratory / Global Intelligence Index
          </div>
          <div className="text-[10px] tracking-[0.2em] uppercase opacity-30">
            Edition 2026 / Volume IV / Obsidian & Gold
          </div>
          <div className="text-[10px] tracking-[0.2em] uppercase opacity-30">
            Hosted at the Edge
          </div>
        </div>
      </footer>
    </div>
  );
}
