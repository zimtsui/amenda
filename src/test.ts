import { Controlflow } from './controlflow.ts';


const cf = Controlflow
	.pipesf((i: string) => i.trimStart())
	.pipeaf(async (i: string) => i.trimEnd());

console.log(await cf.callback('  hello world  '));
