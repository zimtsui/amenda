# Explanation of Amenda in Mathematics

## Functor of Draft 草稿函子

In analogy to `Promise<t>`, which is a type of future values, `Draft<t>` is a type of draft values, because it can be rejected and sent back to the author for revision.

`Promise<t>` 是期值类型，类比地，`Draft<t>` 是草稿类型，因为草稿可以打回去给作者进行修改。

In analogy to the functor `Promise`, which maps from the category of present value types to the category of future value types, the functor `Draft` maps from the category of final value types to the category of draft value types.

`Promise` 函子从现值范畴映射到期值范畴，类比地，`Draft` 函子从终稿范畴映射到草稿范畴。

## Natural Transformations of Draft Functor 草稿函子的自然变换

-	`Draft.eta` is a natural transformation from the identity functor to the functor `Draft`.

	`Draft.eta` 是从恒等函子到 `Draft` 函子的自然变换。

-	`Draft.mu` is a natural transformation from the functor `Draft`$^2$ to the functor `Draft`.

	`Draft.mu` 是从 `Draft`$^2$ 函子到 `Draft` 函子的自然变换。

-	`Draft.from` is a natural transformation from the functor `Promise` to the functor `Draft`.

	`Draft.from` 是从 `Promise` 函子到 `Draft` 函子的自然变换。

-	`Draft.to` is a natural transformation from the functor `Draft` to the functor `Promise`.

	`Draft.to` 是从 `Draft` 函子到 `Promise` 函子的自然变换。

## Kleisli Category of Draft Monad 草稿单子的 Kleisli 范畴

A `Workflow<input, output>` is a morphism in the Kleisli category of the draft monad.

一个 `Workflow<input, output>` 是草稿单子 Kleisli 范畴的态射。

```ts
type Workflow<input, output> = (input: input) => Draft<output>;
```

## Morphisms of Draft Category 草稿范畴的态射

A `Evaluator<input, output>` is a morphism in the Draft Category.

一个 `Evaluator<input, output>` 是草稿范畴的态射。

```ts
type Evaluator<input, output> = (draft: Draft<input>) => Draft<output>;
```
