import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, generateText, tool } from 'ai'
import { z } from "zod";

export const maxDuration = 30;

const provider = createOpenAI({
	apiKey: process.env.INKEEP_API_KEY,
	baseURL: "https://api.inkeep.com/v1",
});

const InkeepSourceContentSchema = z
	.object({
		type: z.union([z.literal("text"), z.string()]),
		media_type: z.union([z.literal("text/plain"), z.string()]).optional(),
		text: z.string().optional(),
		data: z.string().optional(),
	})
	.passthrough();

const InkeepSourceSchema = z
	.object({
		content: z.array(InkeepSourceContentSchema).optional(),
		type: z.union([z.literal("content"), z.string()]).optional(),
		media_type: z.string().optional(),
		data: z.string().optional(),
	})
	.passthrough();

const InkeepRAGDocumentSchema = z
	.object({
		type: z.string(),
		source: InkeepSourceSchema,
		title: z.string().optional(),
		context: z.string().optional(),
		record_type: z.string().optional(),
		url: z.string().optional().nullable(),
	})
	.passthrough();

const InkeepRAGResponseSchema = z
	.object({
		content: z.array(InkeepRAGDocumentSchema),
	})
	.passthrough();

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const query = searchParams.get("query");

	if (!query) {
		return Response.json([]);
	}

	try {
		const { object } = await generateObject({
			model: provider.languageModel("inkeep-rag"),
			messages: [{ role: "user", content: "How do I get started?" }],
			schema: InkeepRAGResponseSchema,
		});

		return Response.json(
			object.content.map((doc) => ({
				title: doc.title,
				content: doc.context,
				url: doc.url,
			})),
		);
	} catch (error) {
		console.error("Inkeep search error:", error);
		return Response.json([], { status: 500 });
	}
}
