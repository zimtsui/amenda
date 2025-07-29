import { Draft, Upwards } from '@zimtsui/amenda';
import OpenAI from 'openai';
declare const openai: OpenAI;

export async function *review(solutions: Draft<string>): Draft<string> {
	for (let r = await solutions.next(), feedback: Upwards;; r = await solutions.next(feedback)) {
		const messages: OpenAI.ChatCompletionMessageParam[] = [
			{ role: 'system', content: 'Please review the solution of math problems.' },
			{ role: 'user', content: r.value },
		];
		const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages });
		if (completion.choices[0]!.message.tool_calls?.[0]?.function.name === 'correct') throw yield r.value;
		feedback = new Upwards(completion.choices[0]!.message.content!);
	}
}
