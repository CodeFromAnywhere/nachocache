interface Env {
  cache: KVNamespace;
}

export default {
  fetch: (request: Request) => {
    //
    return new Response("YO Nacho!");
  },
};
