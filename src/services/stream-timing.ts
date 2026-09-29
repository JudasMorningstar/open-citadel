/**
 * How the answer's text arrived, per request, in development.
 *
 * Tokens spread over a second or more is a stream; all of them inside a few
 * milliseconds is a response something held back and released at once
 * (Azure does this to OpenAI models under zero retention), which on screen
 * is the whole reply popping in, and `createSmoothReveal` paces it out.
 */
export function createStreamTiming() {
  let count = 0;
  let first = 0;
  let last = 0;
  return {
    mark() {
      const now = Date.now();
      if (count === 0) first = now;
      last = now;
      count += 1;
    },
    report() {
      if (count > 0) {
        console.log(`[Samwell Cloud] stream: ${count} text chunks over ${last - first}ms`);
      }
      count = 0;
    },
  };
}
