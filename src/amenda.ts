import { Scoped } from './scoped.ts';
import { Draft } from './draft.ts';


export type Amenda<value, state = void> = Draft<Scoped<state, value>>;
