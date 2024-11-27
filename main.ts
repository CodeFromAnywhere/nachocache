interface Env {
  cache: KVNamespace;
}

type TimeUnit = {
  short: string;
  extended: string;
  multiplier: number;
};

const TIME_UNITS: TimeUnit[] = [
  { short: "s", extended: "sec", multiplier: 1 },
  { short: "m", extended: "min", multiplier: 60 },
  { short: "h", extended: "hour", multiplier: 3600 },
  { short: "d", extended: "day", multiplier: 86400 },
  { short: "w", extended: "week", multiplier: 604800 },
  { short: "M", extended: "month", multiplier: 2592000 }, // 30 days
  { short: "y", extended: "year", multiplier: 31536000 },
];

const DEFAULT_CACHE_DURATION = 2592000; // 30 days
const MAX_CACHE_DURATION = 31536000; // 1 year

function parseTimeString(timeStr: string): number {
  if (timeStr === "inf" || timeStr === "infinite") return Infinity;
  if (timeStr === "default") return DEFAULT_CACHE_DURATION;
  if (timeStr === "none") return 0;

  const parts = timeStr.split("+");
  let totalSeconds = 0;

  for (const part of parts) {
    let matched = false;
    for (const unit of TIME_UNITS) {
      const shortRegex = new RegExp(`^(\\d+)${unit.short}$`);
      const extendedRegex = new RegExp(`^(\\d+)${unit.extended}$`);

      const shortMatch = part.match(shortRegex);
      const extendedMatch = part.match(extendedRegex);
      const match = shortMatch || extendedMatch;

      if (match) {
        const value = parseInt(match[1]);
        if (value < 0) {
          throw new Error("Negative values are not supported");
        }
        totalSeconds += value * unit.multiplier;
        matched = true;
        break;
      }
    }

    if (!matched) {
      throw new Error(`Invalid time format: ${part}`);
    }
  }

  if (totalSeconds > MAX_CACHE_DURATION && totalSeconds !== Infinity) {
    throw new Error("Maximum cache duration exceeded");
  }

  return totalSeconds;
}

async function fetchAndCache(
  url: string,
  duration: number,
  env: Env,
): Promise<Response> {
  const response = await fetch(url);
  const data = await response.clone().arrayBuffer();

  if (duration > 0) {
    const metadata = {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    };

    const expirationTtl = duration === Infinity ? undefined : duration;
    await env.cache.put(url, data, {
      expirationTtl,
      metadata: JSON.stringify(metadata),
    });
  }

  return response;
}

async function getCachedResponse(
  url: string,
  env: Env,
): Promise<Response | null> {
  const cached = await env.cache.getWithMetadata(url, "arrayBuffer");
  if (!cached?.value) return null;

  const metadata = JSON.parse(cached.metadata as string);
  return new Response(cached.value, metadata);
}

export default {
  async fetch(request: Request, env: Env) {
    try {
      const url = new URL(request.url);
      const [, maxAge, ...pathParts] = url.pathname.split("/");

      if (!maxAge || pathParts.length === 0) {
        return new Response("Invalid URL format", { status: 400 });
      }

      const targetUrl = pathParts.join("/");
      const afterParam = url.searchParams.get("after");

      try {
        const duration = parseTimeString(maxAge);

        // Check if force redeployment is requested
        if (afterParam) {
          const afterDate = new Date(afterParam);
          if (isNaN(afterDate.getTime())) {
            return new Response("Invalid after parameter", { status: 400 });
          }
          // Bypass cache if the requested date is after the specified timestamp
          const cached = await getCachedResponse(targetUrl, env);
          if (cached && cached.headers.get("date")) {
            const cachedDate = new Date(cached.headers.get("date")!);
            if (cachedDate >= afterDate) {
              return cached;
            }
          }
          return await fetchAndCache(targetUrl, duration, env);
        }

        // Normal cache flow
        if (duration === 0) {
          return await fetch(targetUrl);
        }

        const cached = await getCachedResponse(targetUrl, env);
        if (cached) return cached;

        return await fetchAndCache(targetUrl, duration, env);
      } catch (error: any) {
        return new Response(error.message, { status: 400 });
      }
    } catch (error: any) {
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};
