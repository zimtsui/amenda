import { Controlflow, type Draft } from '@zimtsui/amenda';

declare const translateChineseToEnglish: (chineseText: string) => Draft<string>;
declare const translateChineseToRussian: (chineseText: string) => Draft<string>;

const cf = Controlflow.from('1+1 等于几？')
	.transform(async (chinese: string) => {
		const [english, russian] = await Promise.all([
			Controlflow.from(chinese).then(translateChineseToEnglish).first(),
			Controlflow.from(chinese).then(translateChineseToRussian).first(),
		]);
		return `# Chinese: ${chinese}\n\n# English: ${english}\n\n# Russian: ${russian}`;
	});
export default await cf.first();
