addEventListener("fetch", (event) => {
  event.respondWith(
    handleRequest(event.request).catch(
      (err) => new Response(err.stack, { status: 500 })
    )
  );
});

/**
 * Many more examples available at:
 *   https://developers.cloudflare.com/workers/examples
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
  const requestUrl = new URL(request.url);
  const path = requestUrl.pathname;

  if (path === '/status/') {
    return new Response(JSON.stringify({ version: '1.0.1' }), { status: 200 });
  }

  if (path.startsWith("/api/v1/ads/list-cached/") || path.startsWith("/api/v1/ads-cache/list-cached/")) {
    const gameId = request.headers.get('roblox-id');

    return callAdsApi(gameId);
  }

  if (path.startsWith("/api/v1/ads/get-dialogs-roblox-client/") || path.startsWith("/api/v1/ads-cache/get-dialogs-roblox-client/")) {
    return callDialogApi();
  }

  return new Response(JSON.stringify({ status: 'ERR_NOT_FOUND', message: "This API scope does not exist on the RoMonitor Stats API Configuration" }), { status: 404 });
}

async function callAdsApi(placeId) {
  let apiCache = await caches.open("adsApiResponses");
  let request = new Request(
    new URL(`https://ads.silicon.digital/api/v1/ads/list?id=${placeId}`)
  )
  // Check if the response is already in the cloudflare cache
  let response = await apiCache.match(request.url);

  if (!response) {
    response = await fetch(request);

    // cache response in cloudflare cache
    response = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Cache-Control": "max-age=600",
        "Content-Type": response.headers.get("Content-Type"),
      }
    });

    await apiCache.put(request.url, response.clone());
  }

    const response2 = await response.json()
    const print = JSON.stringify({ ...response2 });
    const parsed = JSON.parse(print)
    return new Response(JSON.stringify({
        "campaigns": shuffle(parsed.campaigns),
        "creatives": parsed.creatives,
    }), {
        headers: {
            "Cache-Control": "max-age=600",
            "Content-Type": response.headers.get("Content-Type"),
        }
    });
}

async function callDialogApi() {
  let apiCache = await caches.open("adsApiResponses");
  let request = new Request(
    new URL(`https://ads.silicon.digital/api/v1/ads/get-dialogs-roblox-client/`)
  )
  // Check if the response is already in the cloudflare cache
  let response = await apiCache.match(request.url);

  if (!response) {
    response = await fetch(request);

    // cache response in cloudflare cache
    response = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Cache-Control": "max-age=600",
        "Content-Type": response.headers.get("Content-Type"),
      }
    });

    await apiCache.put(request.url, response.clone());
  }

  const response2 = await response.json()
  const print = JSON.stringify(response2);

  return new Response(print, {
      headers: {
          "Cache-Control": "max-age=600",
          "Content-Type": response.headers.get("Content-Type"),
      }
  });
}

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}
