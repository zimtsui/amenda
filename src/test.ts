import { Controlflow } from './controlflow.ts';


const cf = Controlflow
	.pipef(() => 'hello world')
	.pipef((i: string) => i.trimStart())
	.pipeaf(async (i: string) => i.trimEnd());

console.log(await cf.callback());
