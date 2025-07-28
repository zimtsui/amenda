import { Controlflow, Upwards } from '@zimtsui/amenda';
declare function translateEnglishToChinese(englishText: string): AsyncGenerator<string, never, Upwards>;

const cf = Controlflow.from('What does 1+1 equal to ?')
	.map((text: string) => text.trimStart())	// append a sync function
	.transform(async (text: string) => text.trimEnd())	// append an async function
	.then(translateEnglishToChinese)	// append an async generator function
;
export default await cf.first();
