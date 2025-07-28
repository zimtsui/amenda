import { Upwards } from '@zimtsui/amenda';
import OpenAI from 'openai';
declare const openai: OpenAI;

export async function *solve(problem: string): AsyncGenerator<string, never, Upwards> {
	const messages: OpenAI.ChatCompletionMessageParam[] = [
		{ role: 'system', content: 'Please solve math problems.' },
		{ role: 'user', content: problem },
	];
	for (;;) {
		const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages });
		const feedback: Upwards = yield completion.choices[0]!.message.content!;
		messages.push({ role: 'assistant', content: completion.choices[0]!.message.content! });
		messages.push({ role: 'user', content: `Please revise your answer upon the feedback: ${feedback.message}` });
	}
}
