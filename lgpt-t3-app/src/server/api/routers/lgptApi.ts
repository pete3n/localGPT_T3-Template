import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { env } from "~/env.mjs";
import { NextApiResponse } from "next";

const base64ToBlob = (base64: string): Blob => {
    
    const parts = base64.split(',');
        if (parts.length !== 2) {
            throw new Error('Invalid base64 format');
        }

        const byteCharacters = atob(parts[1] ?? '');
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/octet-stream" });

    return blob;
}

interface PromptResponse {
    Answer: string;
    Prompt: string;
    Sources: Array<[string, string]>;
}

interface DeleteResponse {
    message: string;
}

const isDeleteResponse = (obj: unknown): obj is DeleteResponse => 
    typeof obj === 'object' && obj !== null && 'message' in obj && typeof (obj as DeleteResponse).message === 'string';

export const lgptApiRouter = createTRPCRouter({
    saveDocument: publicProcedure
    .input(z.object({
        base64: z.string(),
        name: z.string()
    }))
    .mutation<string>(async ({ input }) => {
        const { base64, name } = input;

        const docBlob = base64ToBlob(base64);
        const formData = new FormData();
        formData.append('document', docBlob, name);

        try { 
            const response = await fetch(`${env.GPT_URL}${env.GPT_SAVE_ROUTE}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Failed to upload document: ${response.statusText}`);
            }

            const responseData = await response.text();
            return responseData;
        } catch (error) {
            console.error("Error uploading document: " , error);
            throw new Error ('Failed to upload document.');
        }
    }),
    postPrompt: publicProcedure
        .input(z.string())
        .mutation<PromptResponse>(async ({ input }) => {
            if (typeof input !== 'string') {
                throw new Error('Input is not a string');
            }
           
            const formData = new URLSearchParams();
            formData.append(env.GPT_PROMPT_BODY_KEY, input);
            const encodedBody = formData.toString().replace(/\+/g, '%20');
            
            try {
                const response = await fetch(`${env.GPT_URL}${env.GPT_PROMPT_ROUTE}?${env.GPT_PROMPT_BODY_KEY}=${encodeURIComponent(input)}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: encodedBody
                });

                if (!response.ok) {
                    throw new Error(`Failed to call lgpt API: ${response.statusText}`);
                }

                const data: PromptResponse = await response.json() as PromptResponse;
                return data;
            } catch (error) {
                console.error("Error posting prompt: ", error);
                throw new Error('Failed to post prompt');
            }
        }),
    runIngest: publicProcedure
        .mutation<boolean>(async () => {

            try {
                const response = await fetch(`${env.GPT_URL}${env.GPT_INGEST_ROUTE}`, {
                    method: 'GET',
                    keepalive: true,
                    signal: AbortSignal.timeout( 6000000 )
                });

                if (!response.ok) {
                    throw new Error(`Failed to run ingest: ${response.statusText}`);
                } else {
                    return true;
                }
            } catch (error) {
                console.error("Error ingesting files: ", error);
                throw new Error('Failed to ingest files');
            }
        }),
    deleteSource: publicProcedure
        .mutation<boolean>(async () => {
            try {
                const response = await fetch(`${env.GPT_URL}${env.GPT_DELETE_ROUTE}`, {
                    method: 'GET',
                });

                // The localGPT API should by updated to return a status code for the delete endpoint operation
                // That would be much easier to handle than this response
                const rawResponse: unknown = await response.json();
                
                if (!isDeleteResponse(rawResponse)) {
                    console.log('Unexpected API response format');
                    throw new Error('Unexpected API response format');
                } else {
                    const deleteResponse: DeleteResponse = rawResponse;
                    if (deleteResponse.message.includes(`successfully deleted`)) {
                        return true
                    } else {
                        throw new Error(`Failed to delete and recreate source directory: ${response.statusText}`);
                    }
                }
            } catch (error) {
                console.error("Error deleting source directory: ", error);
                throw new Error('Failed to delete source directory');
            }
        })
});
