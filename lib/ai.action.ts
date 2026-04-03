import puter from "@heyputer/puter.js";
import { ROOMIFY_RENDER_PROMPT } from "./constents";

export async function fetchAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Failed to convert blob to data URL."));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read blob as data URL."));
    };

    reader.readAsDataURL(blob);
  });
}

const getImageSrc = (image: unknown): string | null => {
  if (typeof image === "string" && image) return image;

  if (
    typeof image === "object" &&
    image !== null &&
    "src" in image &&
    typeof image.src === "string" &&
    image.src
  ) {
    return image.src;
  }

  if (
    typeof image === "object" &&
    image !== null &&
    typeof image.toString === "function"
  ) {
    const value = image.toString();
    if (typeof value === "string" && value && value !== "[object Object]") {
      return value;
    }
  }

  return null;
};

export const generate3DView = async ({ sourceImage }: Generate3DViewParams) => {
  const dataUrl = sourceImage.startsWith("data:")
    ? sourceImage
    : await fetchAsDataUrl(sourceImage).catch((error) => {
        const message =
          error instanceof Error ? error.message : "Unknown image fetch error";
        throw new Error(`Failed to prepare source image for generation: ${message}`);
      });

  const [metadata, base64] = dataUrl.split(",", 2);
  const mimeType = metadata?.split(";")[0]?.split(":")[1];

  if (!base64 || !mimeType) {
    throw new Error("Invalid source image payload");
  }

  const response = await puter.ai.txt2img({
    prompt: ROOMIFY_RENDER_PROMPT,
    provider: "gemini",
    model: "gemini-2.5-flash-image-preview",
    input_image: base64,
    input_image_mime_type: mimeType,
    ratio: { w: 1024, h: 1024 },
  });

  const renderedImage = getImageSrc(response);

  if (!renderedImage) {
    throw new Error("AI image generation returned no image source");
  }

  return { renderedImage, renderedPath: undefined };
};
