import { GeneratedFile } from '../types';

// A list of file extensions that can be omitted in imports
const RESOLVE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

/**
 * Resolves a relative module import path to an absolute path from the project root,
 * attempting to add extensions or find index files if necessary.
 * @param source The original import path (e.g., './Button').
 * @param currentFilePath The path of the file containing the import.
 * @param allJsFilePaths An array of all JS-like file paths in the project.
 * @returns The resolved absolute path (e.g., '/components/Button.tsx').
 */
const resolveModulePath = (source: string, currentFilePath: string, allJsFilePaths: string[]): string => {
    // Not a relative path, probably a library from import map (e.g., 'react').
    if (!source.startsWith('./') && !source.startsWith('../')) {
        return source;
    }

    const fromDirectory = currentFilePath.includes('/') ? currentFilePath.substring(0, currentFilePath.lastIndexOf('/')) : '';
    // Use URL for robust path resolution (handles './' and '../')
    let resolvedPath = new URL(source, `file:///${fromDirectory}/`).pathname;
    const resolvedPathWithoutLeadingSlash = resolvedPath.substring(1);

    // 1. Direct match (e.g., user wrote `import './App.tsx'`)
    if (allJsFilePaths.includes(resolvedPathWithoutLeadingSlash)) {
        return resolvedPath;
    }

    // 2. Try adding extensions (e.g., `import './App'` -> `import './App.tsx'`)
    for (const ext of RESOLVE_EXTENSIONS) {
        if (allJsFilePaths.includes(resolvedPathWithoutLeadingSlash + ext)) {
            return resolvedPath + ext;
        }
    }

    // 3. Try resolving as a directory with an index file (e.g., `import './components'`)
    const directoryPath = resolvedPathWithoutLeadingSlash.endsWith('/') 
        ? resolvedPathWithoutLeadingSlash.slice(0, -1) 
        : resolvedPathWithoutLeadingSlash;
        
    for (const ext of RESOLVE_EXTENSIONS) {
        const indexPath = `${directoryPath}/index${ext}`;
        if (allJsFilePaths.includes(indexPath)) {
            return `/${indexPath}`;
        }
    }
    
    // If we can't resolve it, return the original path. It might be a non-JS asset (like a CSS file handled by another plugin).
    return resolvedPath;
};

/**
 * A custom Babel plugin factory to resolve relative module paths to absolute paths.
 * This is crucial for the import map to work correctly with blob URLs.
 * It transforms `import A from './A'` into `import A from '/A.tsx'`.
 * @returns A Babel plugin object.
 */
const createModuleResolverPlugin = (allJsFilePaths: string[]) => ({
    visitor: {
        // Handles `import ... from '...'`
        ImportDeclaration(path, state) {
            const source = path.node.source.value;
            path.node.source.value = resolveModulePath(source, state.file.opts.filename, allJsFilePaths);
        },
        // Handles `export { a } from './a'`
        ExportNamedDeclaration(path, state) {
            if (path.node.source) {
                 const source = path.node.source.value;
                 path.node.source.value = resolveModulePath(source, state.file.opts.filename, allJsFilePaths);
            }
        },
         // Handles `export * from './a'`
        ExportAllDeclaration(path, state) {
            if (path.node.source) {
                 const source = path.node.source.value;
                 path.node.source.value = resolveModulePath(source, state.file.opts.filename, allJsFilePaths);
            }
        }
    }
});


/**
 * A custom Babel plugin factory to handle CSS imports within JS/TS files.
 * It finds `import './style.css'` statements, records the path, and removes
 * the import declaration to prevent runtime errors in the browser.
 * @returns A Babel plugin object.
 */
const createCssImportPlugin = () => ({
    visitor: {
        ImportDeclaration(path, state) {
            const source = path.node.source.value;
            if (source.endsWith('.css')) {
                const currentFilePath = state.file.opts.filename;
                // Resolve the relative CSS path to an absolute path from the project root
                const fromDirectory = currentFilePath.includes('/') ? currentFilePath.substring(0, currentFilePath.lastIndexOf('/')) : '';
                const resolvedCssPath = new URL(source, `file:///${fromDirectory}/`).pathname.substring(1);
                
                // Add the resolved path to a custom metadata field
                if (!state.file.metadata.cssImports) {
                    state.file.metadata.cssImports = [];
                }
                state.file.metadata.cssImports.push(resolvedCssPath);
                
                // Remove the import from the code
                path.remove();
            }
        },
    },
});

/**
 * Creates a sandboxed HTML document to preview the user's project.
 * This function simulates a modern build tool like Vite in the browser by:
 * 1. Transpiling all TSX/JSX/TS/JS files using Babel.
 * 2. Rewriting relative module imports to absolute paths with extension resolution.
 * 3. Handling CSS imports inside JavaScript files.
 * 4. Creating Blob URLs for all assets.
 * 5. Generating a dynamic import map to handle module resolution.
 * 6. Injecting all styles and the import map into the main index.html.
 * 
 * @param files The list of all generated files in the project.
 * @returns An HTML string to be used as the srcDoc for the preview iframe.
 */
export const createPreviewHtml = (files: GeneratedFile[]): string => {
    // @ts-ignore - Babel is available in the global scope from index.html
    const Babel = window.Babel;
    if (!Babel) {
        return '<html><body><h1>Babel not loaded</h1><p>The preview requires Babel to transpile code.</p></body></html>';
    }

    let htmlFile = files.find(f => f.name === 'index.html' || f.name.endsWith('/index.html'));

    // Fallback logic for generating a temporary index.html
    if (!htmlFile) {
        const entryPoint = files.find(f => /^(src\/)?(main|index)\.tsx?$/.test(f.name));
        if (entryPoint) {
            htmlFile = {
                id: '__generated_index.html',
                name: '__generated_index.html',
                language: 'html',
                content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/${entryPoint.name}"></script>
  </body>
</html>`,
            };
        } else {
            return '<html><body style="font-family: sans-serif; padding: 2em; color: #333;"><h1>No index.html found</h1><p>A preview requires an <strong>index.html</strong> file in your project root.</p><p>Please ask the AI to create one, for example: "Create an index.html file that loads my React app."</p></body></html>';
        }
    }

    const jsFiles = files.filter(f => /\.(js|ts|jsx|tsx)$/.test(f.name));
    const cssFiles = files.filter(f => f.name.endsWith('.css'));
    const cssFileMap = new Map(cssFiles.map(f => [f.name, f.content]));
    const allJsFilePaths = jsFiles.map(f => f.name);
    
    const cssImportsFromJs = new Set<string>();
    const transpiledJsMap = new Map<string, string>();
    const importMap = { imports: {} };
    const blobUrlMap = new Map<string, string>();

    // 1. Transpile JS/TSX files, resolve modules, and collect CSS imports
    for (const file of jsFiles) {
        try {
            const cssImportPlugin = createCssImportPlugin();
            const moduleResolverPlugin = createModuleResolverPlugin(allJsFilePaths);
            const result = Babel.transform(file.content, {
                presets: ['react', 'typescript'],
                filename: file.name,
                plugins: [cssImportPlugin, moduleResolverPlugin],
            });

            if (result.metadata.cssImports) {
                (result.metadata.cssImports as string[]).forEach(cssPath => cssImportsFromJs.add(cssPath));
            }
            if (result.code) {
                transpiledJsMap.set(file.name, result.code);
            }

        } catch (e) {
            console.error(`Babel transpilation failed for ${file.name}:`, e);
            const error = e instanceof Error ? e.message : String(e);
            return `<html><body style="font-family: sans-serif; padding: 1em;">
                <h1>Transpilation Error in ${file.name}</h1>
                <pre style="white-space: pre-wrap; background: #fee; border: 1px solid red; padding: 1em; font-family: monospace;">${error.replace(/</g, '&lt;')}</pre>
            </body></html>`;
        }
    }
    
    // 2. Create Blob URLs for transpiled JS and build the import map
    for (const [name, code] of transpiledJsMap.entries()) {
        const blob = new Blob([code], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        blobUrlMap.set(name, url);
        // The key in the import map needs to be an absolute-like path
        importMap.imports[`/${name}`] = url;
    }

    // Add common external dependencies to the import map
    importMap.imports['react'] = 'https://aistudiocdn.com/react@^19.2.0';
    importMap.imports['react-dom/client'] = 'https://aistudiocdn.com/react-dom@^19.2.0/client';
    importMap.imports['react/jsx-runtime'] = 'https://aistudiocdn.com/react@^19.2.0/jsx-runtime';
    importMap.imports['react/jsx-dev-runtime'] = 'https://aistudiocdn.com/react@^19.2.0/jsx-dev-runtime';


    // 3. Prepare the final HTML content
    let htmlContent = htmlFile.content;

    // 3a. Find the entry script tag and replace its src with the corresponding Blob URL
    const scriptModuleRegex = /<script\s+type="module"\s+src="([^"]+)"\s*><\/script>/;
    const match = htmlContent.match(scriptModuleRegex);
    if (match) {
        let entrySrc = match[1];
        if (entrySrc.startsWith('/')) { // Normalize path
            entrySrc = entrySrc.substring(1);
        }
        const entryBlobUrl = blobUrlMap.get(entrySrc);
        if (entryBlobUrl) {
            htmlContent = htmlContent.replace(match[0], `<script type="module" src="${entryBlobUrl}"></script>`);
        }
    }

    // 3b. Collect all CSS from both JS imports and <link> tags
    const allCssStyles = new Set<string>();
    cssImportsFromJs.forEach(path => {
        if (cssFileMap.has(path)) {
            allCssStyles.add(cssFileMap.get(path)!);
        }
    });
    
    const linkTagRegex = /<link\s+.*?rel="stylesheet"\s+href="([^"]+)"\s*\/?>/g;
    htmlContent = htmlContent.replace(linkTagRegex, (match, href) => {
        let cssPath = href;
        if (cssPath.startsWith('/')) {
            cssPath = cssPath.substring(1);
        }
        if (cssFileMap.has(cssPath)) {
            allCssStyles.add(cssFileMap.get(cssPath)!);
        }
        return ''; // Remove the original <link> tag
    });
    
    // 3c. Inject all collected CSS and the import map into the <head>
    const finalCss = Array.from(allCssStyles).join('\n\n/* --- */\n\n');
    const styleTag = `<style type="text/css">\n${finalCss}\n</style>`;
    const importMapTag = `<script type="importmap">\n${JSON.stringify(importMap, null, 2)}\n</script>`;
    
    htmlContent = htmlContent.replace(/<head>/i, `<head>\n    ${styleTag}\n    ${importMapTag}`);
    
    // 3d. Clean up the Babel script tag, as it's no longer needed in the preview
    htmlContent = htmlContent.replace(/<script src="https:\/\/unpkg\.com\/@babel\/standalone\/babel\.min\.js"><\/script>/, '');

    return htmlContent;
};