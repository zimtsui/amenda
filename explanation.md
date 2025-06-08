# Explanation of Amenda in Mathematics

## Functor of Draft 草稿函子

In analogy to `Promise<t>`, which is a type of future values, `Draft<t>` is a type of draft values, because it can be rejected and sent back to the author for revision.

`Promise<t>` 是期值类型，类比地，`Draft<t>` 是草稿类型，因为草稿可以打回去给作者进行修改。

In analogy to the functor `Promise`, which maps from the category of present value types to the category of future value types, the functor `Draft` maps from the category of final value types to the category of draft value types.

`Promise` 函子从现值范畴映射到期值范畴，类比地，`Draft` 函子从终稿范畴映射到草稿范畴。

```ts
export class Rejected extends Error {}
export type Draft<t> = AsyncGenerator<t, never, Rejected>;
```

## Natural Transformations of Draft Functor 草稿函子的自然变换

-	`eta` is a natural transformation from the identity functor to the functor `Draft`.

	`eta` 是从恒等函子到 `Draft` 函子的自然变换。

-	`mu` is a natural transformation from the functor `Draft`$^2$ to the functor `Draft`.

	`mu` 是从 `Draft`$^2$ 函子到 `Draft` 函子的自然变换。

-	`from` is a natural transformation from the functor `Promise` to the functor `Draft`.

	`from` 是从 `Promise` 函子到 `Draft` 函子的自然变换。

-	`to` is a natural transformation from the functor `Draft` to the functor `Promise`.

	`to` 是从 `Draft` 函子到 `Promise` 函子的自然变换。

```ts
export declare function eta<t>(x: t): Draft<t>;
export declare function mu<t>(x: Draft<Draft<t>>): Draft<t>;
export declare function from<t>(x: Promise<t>): Draft<t>;
export declare function to<t>(x: Draft<t>): Promise<t>;
```

## Stateful Value

A stateful value is a tuple of a value and a state.

一个有状态的值是值和状态的构成的元组。

```ts
export type StatefulValue<value, state> = [value, state];
```

## Kleisli Category of Draft Monad 草稿单子的 Kleisli 范畴

A `Workflow` is a morphism in the Kleisli category of the draft monad.

一个 `Workflow` 是草稿单子 Kleisli 范畴的态射。

```ts
export type Kleisli<input, output> = (input: input) => Draft<output>;
export type Workflow<i, o, istate, ostate> = Kleisli<StatefulValue<i, istate>, StatefulValue<o, ostate>>;
```

## Morphisms of Draft Category 草稿范畴的态射

An evaluator in the design pattern of optimizer evaluator is a morphism in the draft category.

优化评估设计模式中的评估器是草稿范畴的态射。

```ts
export type IterationFunction<i, o, istate, ostate> = Morphism<StatefulValue<i, istate>, StatefulValue<o, ostate>>;
```
