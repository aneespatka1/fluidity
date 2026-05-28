// src/inngest/functions.ts
import { google } from "@ai-sdk/google";
import { generateText } from 'ai';

import { inngest } from "./client";
import { firecrawl } from "@/lib/firecrawl";

const URL_REGEX = /https?:\/\/[^\s]+/g;

export const processTask = inngest.createFunction(
  { id: "process-task" }, 
  { event: "app/task.created" },
  async ({ event, step }) => {
    const result = await step.run("handle-task", async () => {
      return { processed: true, id: event.data.id };
    });

    await step.sleep("pause", "1s");

    return { message: `Task ${event.data.id} complete`, result };
  }
);

export const processText = inngest.createFunction(
  { id: "process-text" }, 
  { event: "app/text.generate" },
  async ({ event, step }) => { 

    const { prompt } = event.data as { prompt: string };

    const urls = await step.run("extract-urls", async () => {
        return prompt.match(URL_REGEX) ?? [];
    }) as string[];

    const scraped_content = await step.run("scrape-urls", async () => {
        const result = await Promise.all(
          urls.map(async (url) => {
            try {
              const result = await firecrawl.scrape(url, { formats: ["markdown"] });
              return result.markdown ?? null;
            } catch (error) {
              console.error(`Error fetching ${url}:`, error);
              return null;
            }
          })
        );
        return result.filter(Boolean).join("\n\n");
    });

    const final_prompt = `Question: ${prompt}\n\nContext: ${scraped_content}`;

    await step.run("process-text", async () => {
        return await generateText({
            model: google('gemini-3.1-flash-lite'),
            prompt: final_prompt,
        });
    });
  }
);