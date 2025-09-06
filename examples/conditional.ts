import { Controlflow, type Draft } from '@zimtsui/amenda';

declare const determineLanguage: (text: string) => Promise<'Chinese' | 'Russian' | 'English'>;
declare const translateChineseToEnglish: (chineseText: string) => Draft<string>;
declare const translateRussianToEnglish: (russianText: string) => Draft<string>;
declare const solveEnglishMathProblem: (englishMathProblem: string) => Draft<string>;

const cf = Controlflow.from('1+1 等于几？')
	.then(async function *(mathProblem: string): Draft<string> {
		switch (await determineLanguage(mathProblem)) {
			case 'Chinese': return yield *translateChineseToEnglish(mathProblem); break;
			case 'Russian': return yield *translateRussianToEnglish(mathProblem); break;
			case 'English': return yield mathProblem; break;
			default: throw new Error('Language Not Supported'); break;
		}
	}).then(solveEnglishMathProblem)
;
export default await cf.first();
