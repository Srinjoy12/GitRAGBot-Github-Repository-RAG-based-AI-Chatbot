declare module "ai" {
  export class StreamingTextResponse extends Response {
    constructor(stream: ReadableStream);
  }
  
  export function OpenAIStream(response: any): ReadableStream;
} 