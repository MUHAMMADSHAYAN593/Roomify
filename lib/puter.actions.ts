import puter from "@heyputer/puter.js";
import { getOrCreateHostingConfig, UploadImageToHosting } from "./putter.hosting";
import { isHostedUrl } from "./utils";

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

export const createProject = async ({item}: CreateProjectParams) : Promise<DesignItem | null | undefined > => {
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
        
        return payload;
    } catch (error) {
        console.log(`Failed to save project: ${error}`)
        return null;
    }
}