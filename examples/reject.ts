import { Upwards } from '@zimtsui/amenda';
import OpenAI from 'openai';
declare const openai: OpenAI;

export async function *solve(problem: string): AsyncGenerator<string, never, Upwards> {
	const messages: OpenAI.ChatCompletionMessageParam[] = [
		{ role: 'system', content: 'Please solve math problems.' },
		{ role: 'user', content: problem },
	];
	const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages });
	if (completion.choices[0]!.message.tool_calls?.[0]?.function.name === 'fail')
		throw new Upwards('The problem is too hard.');
	// The `throw` propagates the feedback from downstream to upstream.
	throw yield completion.choices[0]!.message.content!;
}
