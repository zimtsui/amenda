import { Downwards, Draft, Upwards } from '@zimtsui/amenda';
import OpenAI from 'openai';
declare const openai: OpenAI;

export async function *solve(problem: string): Draft<string> {
	const messages: OpenAI.ChatCompletionMessageParam[] = [
		{ role: 'system', content: 'Please solve math problems.' },
		{ role: 'user', content: problem },
	];
	const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages });
	const feedback: Upwards = yield completion.choices[0]!.message.content!;
	throw yield Promise.reject(new Downwards('My solution is correct, and your feedback is wrong.'));
}
