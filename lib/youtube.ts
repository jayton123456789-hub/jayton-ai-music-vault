export type ChannelVideo = {
  id: string;
  title: string;
  thumbnailUrl: string;
  publishedLabel: string;
};

const YOUTUBE_CHANNEL_HANDLE = "jayton_ai_music";
const YOUTUBE_CHANNEL_URL = `https://www.youtube.com/@${YOUTUBE_CHANNEL_HANDLE}`;
const YOUTUBE_VIDEOS_URL = `${YOUTUBE_CHANNEL_URL}/videos`;

function readSimpleText(
  value?: { simpleText?: string; runs?: Array<{ text?: string }> }
) {
  if (value?.simpleText) {
    return value.simpleText;
  }

  if (value?.runs?.length) {
    return value.runs.map((item) => item.text ?? "").join("").trim();
  }

  return "";
}

function decodeYoutubeText(value: string) {
  return value
    .replace(/\\u0026/g, "&")
    .replace(/\\u003d/g, "=")
    .replace(/\\u002f/g, "/")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, " ");
}

function extractInitialData(html: string) {
  const scriptMatch =
    html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/) ??
    html.match(/window\["ytInitialData"\] = (\{[\s\S]*?\});<\/script>/);

  if (!scriptMatch?.[1]) {
    return null;
  }

  try {
    return JSON.parse(scriptMatch[1]) as unknown;
  } catch {
    return null;
  }
}

function collectVideoRenderers(node: unknown, out: Array<Record<string, unknown>>) {
  if (!node || typeof node !== "object") {
    return;
  }

  if ("videoRenderer" in node) {
    const candidate = (node as { videoRenderer?: unknown }).videoRenderer;
    if (candidate && typeof candidate === "object") {
      out.push(candidate as Record<string, unknown>);
    }
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        collectVideoRenderers(item, out);
      }
      continue;
    }

    collectVideoRenderers(value, out);
  }
}

export async function getChannelVideos(limit = 12): Promise<ChannelVideo[]> {
  const response = await fetch(YOUTUBE_VIDEOS_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9"
    },
    next: { revalidate: 60 * 30 }
  }).catch(() => null);

  if (!response?.ok) {
    return [];
  }

  const html = await response.text().catch(() => "");

  if (!html) {
    return [];
  }

  const initialData = extractInitialData(html);

  if (!initialData) {
    return [];
  }

  const renderers: Array<Record<string, unknown>> = [];
  collectVideoRenderers(initialData, renderers);

  const seen = new Set<string>();
  const videos: ChannelVideo[] = [];

  for (const renderer of renderers) {
    if (videos.length >= limit) {
      break;
    }

    const id = typeof renderer.videoId === "string" ? renderer.videoId : "";
    if (!id || seen.has(id)) {
      continue;
    }

    seen.add(id);

    const title = readSimpleText(
      renderer.title as { simpleText?: string; runs?: Array<{ text?: string }> } | undefined
    );
    const publishedLabel = readSimpleText(
      renderer.publishedTimeText as
        | { simpleText?: string; runs?: Array<{ text?: string }> }
        | undefined
    );
    const thumbnailCandidates =
      (renderer.thumbnail as { thumbnails?: Array<{ url?: string }> } | undefined)?.thumbnails ??
      [];
    const thumbnailUrl =
      thumbnailCandidates.at(-1)?.url ??
      thumbnailCandidates.at(0)?.url ??
      `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

    videos.push({
      id,
      title: decodeYoutubeText(title || "Untitled video"),
      publishedLabel: decodeYoutubeText(publishedLabel || "Recently published"),
      thumbnailUrl: decodeYoutubeText(thumbnailUrl)
    });
  }

  return videos;
}

export function getYoutubeChannelUrl() {
  return YOUTUBE_CHANNEL_URL;
}
