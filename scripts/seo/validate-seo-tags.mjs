import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const TITLE_MAX = 60;
const META_MAX = 155;

function walkDir(dir, fileList = []) {
  const files = readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = join(dir, file.name);
    if (file.isDirectory()) {
      walkDir(fullPath, fileList);
    } else if (file.name.endsWith('.html')) {
      fileList.push(fullPath);
    }
  }
  
  return fileList;
}

function extractMetaTag(html, name) {
  const regex = new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["'](.*?)["'][^>]*>`, 'i');
  const match = html.match(regex);
  return match ? match[1].replace(/\s+/g, ' ').trim() : null;
}

function validateHtmlFile(filePath) {
  const html = readFileSync(filePath, 'utf-8');
  const errors = [];
  const warnings = [];
  
  // Extract title
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : null;
  
  // Extract meta description
  const metaDescription = extractMetaTag(html, 'description');
  
  // Count H1 tags
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  
  // Validate title
  if (!title) {
    errors.push(`Missing <title> tag`);
  } else if (title.length > TITLE_MAX) {
    errors.push(`Title exceeds ${TITLE_MAX} chars: "${title}" (${title.length} chars)`);
  }
  
  // Validate meta description
  if (!metaDescription) {
    errors.push(`Missing <meta name="description"> tag`);
  } else if (metaDescription.length > META_MAX) {
    errors.push(`Meta description exceeds ${META_MAX} chars: "${metaDescription.substring(0, 80)}..." (${metaDescription.length} chars)`);
  }
  
  // Validate H1 count
  if (h1Count !== 1) {
    errors.push(`Expected exactly 1 <h1>, found ${h1Count}`);
  }
  
  return {
    filePath,
    title,
    metaDescription,
    h1Count,
    errors,
    warnings,
  };
}

function main() {
  const distDir = 'dist';
  const htmlFiles = walkDir(distDir);
  
  console.log(`\n=== SEO Tag Validation ===`);
  console.log(`Validating ${htmlFiles.length} HTML files...\n`);
  
  const results = htmlFiles.map(validateHtmlFile);
  const allErrors = results.filter(r => r.errors.length > 0);
  const metaDescriptions = new Map();
  
  // Check for duplicate meta descriptions (excluding redirects and special pages)
  for (const result of results) {
    if (!result.filePath.includes('redirect') && result.metaDescription) {
      const key = result.metaDescription.toLowerCase();
      if (metaDescriptions.has(key)) {
        metaDescriptions.get(key).push(result.filePath);
      } else {
        metaDescriptions.set(key, [result.filePath]);
      }
    }
  }
  
  const duplicates = Array.from(metaDescriptions.entries())
    .filter(([_, files]) => files.length > 1)
    .map(([desc, files]) => ({ desc, files }));
  
  // Report results
  if (allErrors.length > 0) {
    console.log(`❌ Found ${allErrors.length} files with SEO tag issues:\n`);
    
    for (const result of allErrors) {
      const relPath = relative(process.cwd(), result.filePath);
      console.log(`  ${relPath}`);
      for (const error of result.errors) {
        console.log(`    - ${error}`);
      }
    }
    
    console.log('');
  } else {
    console.log(`✅ All files passed title/meta/H1 validation!\n`);
  }
  
  if (duplicates.length > 0) {
    console.log(`⚠️  Found ${duplicates.length} duplicate meta descriptions:\n`);
    for (const { desc, files } of duplicates) {
      console.log(`  "${desc}"`);
      for (const file of files) {
        console.log(`    - ${relative(process.cwd(), file)}`);
      }
    }
    console.log('');
  }
  
  // Summary
  const titleErrors = allErrors.filter(r => r.errors.some(e => e.includes('title')));
  const metaErrors = allErrors.filter(r => r.errors.some(e => e.includes('description')));
  const h1Errors = allErrors.filter(r => r.errors.some(e => e.includes('H1')));
  
  console.log(`Summary:`);
  console.log(`  - Title errors: ${titleErrors.length}`);
  console.log(`  - Meta description errors: ${metaErrors.length}`);
  console.log(`  - H1 count errors: ${h1Errors.length}`);
  console.log(`  - Duplicate meta descriptions: ${duplicates.length}\n`);
  
  // Exit with error if there are any critical errors
  if (allErrors.length > 0) {
    console.error('❌ SEO validation failed. Fix the issues above and rebuild.');
    process.exit(1);
  }
  
  console.log('✅ SEO validation passed!\n');
}

main();
