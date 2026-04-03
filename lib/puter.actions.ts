import puter from "@heyputer/puter.js";
import { getOrCreateHostingConfig, UploadImageToHosting } from "./putter.hosting";
import { isHostedUrl } from "./utils";
import { PUTER_WORKER_URL } from "./constents";

const NORMALIZED_PUTER_WORKER_URL = PUTER_WORKER_URL.replace(/\/+$/, "");

const buildWorkerUrl = (path: string) => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${NORMALIZED_PUTER_WORKER_URL}${normalizedPath}`;
};

export const signIn = async() => puter.auth.signIn()
export const signOut = () => puter.auth.signOut()

export const getCurrentUser = async() => {
    try {
        return await puter.auth.getUser();
    } catch (error) {
        console.error("Error fetching current user:", error);
        return null;
    }
}

export const createProject = async ({item , visibility="private"}: CreateProjectParams) : Promise<DesignItem | null | undefined > => {
    if (!NORMALIZED_PUTER_WORKER_URL) {
        console.warn("PUTER_WORKER_URL is not defined. Cannot create project.");
        return null;
    }
    const projectId = item.id
    const hosting = await getOrCreateHostingConfig()
    const hostedSource = projectId ? await UploadImageToHosting({
        hosting , url: item.sourceImage , projectId , label: 'source'
    }) : null

    const hostedrender = projectId && item.renderedImage ? await UploadImageToHosting({
        hosting , url: item.renderedImage , projectId , label: 'rendered'
    }) : null

    const resolvedSource = hostedSource?.url || (isHostedUrl(item.sourceImage) ? item.sourceImage : '')

    if (!resolvedSource) {
        console.warn('Failed to host source image , skipping save.')
        return null
    }

    const resolvedRender = hostedrender?.url ? hostedrender.url : item.renderedImage && isHostedUrl(item.renderedImage) ? item.renderedImage : undefined;

    const { 
        sourcePath: _sourcePath,
        renderedPath: _renderedPath,
        publicPath: _publicPath,
        ...rest
    } = item

    const payload = {
        ...rest,
        sourceImage: resolvedSource,
        renderedImage: resolvedRender,
    }

    try {
        // Call the puter woker to store project in kv

        const response = await puter.workers.exec(buildWorkerUrl("/api/projects/save"), {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({project: payload , visibility})
        })

        if (!response.ok) {
            console.error("Error saving project:", await response.text());
            return null;
        }

        const data = await response.json() as { project?: DesignItem | null };
        
        return data?.project || null;
    } catch (error) {
        console.log(`Failed to save project: ${error}`)
        return null;
    }
}


export const getProjects = async ()=>{
    if (!NORMALIZED_PUTER_WORKER_URL) {
       console.warn("PUTER_WORKER_URL is not defined. Cannot fetch projects.");
       return []; 
    }

    try {
        const response = await puter.workers.exec(buildWorkerUrl("/api/projects/list"), {
            method: 'GET'
        })
        if (!response.ok) {
            console.error("Error fetching projects:", await response.text());
            return [];
        }
        const data = await response.json() as { projects: DesignItem[] | null };
        return Array.isArray(data.projects) ? data.projects : [];
    } catch (error) {
        console.error("Error fetching projects:", error);
        return [];
    }
}

export const getProjectById = async ({ id }: { id: string }) => {
    if (!NORMALIZED_PUTER_WORKER_URL) {
        console.warn("Missing VITE_PUTER_WORKER_URL; skipping project fetch.");
        return null;
    }

    try {
        const response = await puter.workers.exec(
            buildWorkerUrl(`/api/projects/get?id=${encodeURIComponent(id)}`),
            { method: "GET" },
        );

        if (!response.ok) {
            console.error("Failed to fetch project:", await response.text());
            return null;
        }

        const data = (await response.json()) as {
            project?: DesignItem | null;
        };

        return data?.project ?? null;
    } catch (error) {
        console.error("Failed to fetch project:", error);
        return null;
    }
};
