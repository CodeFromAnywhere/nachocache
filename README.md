# Nacho Cache

> Don't worry about your cache, nachocache got you!

<img src="public/logo.svg" width=150 height=150 />

API:

`nachocache.com/MAX-AGE/URL`

Before nachocache:

- This loads within 5 seconds: https://r.jina.ai/firecrawl.dev/blog
- Every request is charged for to your API Key

With nachocache:

- This loads 1 time in 5 seconds, afer that within 10ms for the coming 30 days: https://nachocache.com/1m/r.jina.ai/firecrawl.dev/blog
- Only 1 request per month will be charged for by Jina, the rest only costs you 2x the price of [Cloudflare R2](https://developers.cloudflare.com/r2/pricing/#r2-pricing)

# TODO

- 🟠 implement chatcompletions.com
- 🟠 implement nachocache.com using a kv with a timeout
- Ensure [this](https://chatcompletions.com/from/nachocache.com/1m/r.jina.ai/firecrawl.dev/blog/base/anthropic.actionschema.com/model/claude-3-5-sonnet-20241022/prompt/respond%20with%20a%20string%20array%20of%20all%20blog%20URLs%20in%20a%20JSON%20codeblock/output.json) magically returns a list of blogs as JSON, and is fast.
- Make this work in extexe
- If needed, add `?after=datetime` so we can do forced redeployments too

## Time Indication Specification for Nacho Cache

## Basic Format

The max age parameter supports both short and extended formats for different time units:

### Short Format

- `s` - seconds (e.g., 30s)
- `m` - minutes (e.g., 15m)
- `h` - hours (e.g., 24h)
- `d` - days (e.g., 7d)
- `w` - weeks (e.g., 2w)
- `M` - months (e.g., 1M)
- `y` - years (e.g., 1y)

### Extended Format

- `sec` - seconds (e.g., 30sec)
- `min` - minutes (e.g., 15min)
- `hour` - hours (e.g., 24hour)
- `day` - days (e.g., 7day)
- `week` - weeks (e.g., 2week)
- `month` - months (e.g., 1month)
- `year` - years (e.g., 1year)

## Usage Examples

```
https://nachocache.com/30s/example.com/path
https://nachocache.com/15min/example.com/path
https://nachocache.com/24h/example.com/path
https://nachocache.com/7d/example.com/path
https://nachocache.com/2w/example.com/path
https://nachocache.com/1M/example.com/path
https://nachocache.com/1y/example.com/path
```

## Combination Format

Multiple time units can be combined using the plus (+) symbol:

```
https://nachocache.com/1h+30m/example.com/path    // 1 hour and 30 minutes
https://nachocache.com/1d+12h/example.com/path    // 1 day and 12 hours
https://nachocache.com/1M+2w/example.com/path     // 1 month and 2 weeks
```

## Special Values

- `inf` or `infinite` - Cache indefinitely
- `default` - Use system default (30 days)
- `none` - No caching (passthrough)

## Error Handling

- Invalid time formats will return a 400 Bad Request with an error message
- Negative values are not supported and will return an error
- Maximum allowed cache duration is 1 year (configurable by system admin)

## Best Practices

1. Use the shortest possible format for better URL readability
2. When combining units, order from largest to smallest time unit
3. For durations longer than 24 hours, prefer using days instead of hours
4. For durations longer than 7 days, prefer using weeks instead of days
5. Use the special value `default` when standard caching behavior is desired
