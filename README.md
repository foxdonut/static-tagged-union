# static-tagged-union

A simple, minimal, flexible, forgiving, static, serializable, tagged union utility.

## Definition

Tagged unions, also known as sum types or union types, are useful for handling cases in a way
that is nicer than `switch/case` or `if/else`.

Aside from tagged unions having cases that you define, there are specific unions that are commonly
useful:

- Maybe (Nothing, Just)
- Either (Left, Right)
- Result (Ok, Err)

These types are similar and, in `static-tagged-union`, are combined into a single helper type:

- Maybe (N, Y)

Just like general `TaggedUnion`s, `Maybe` instances can optionally contain params.
That goes for both `N` and `Y`. In that sense, `Maybe` is closer to `Either` and `Result`.

`Maybe` is provided for convenience, since it is very common to have present/absent values,
true/false values, and other binary possibilities.

## Motivation

I looked at several similar libraries, really trying to find one that meets all my requirements,
namely:

- static functions to handle cases, not instance functions on returned types
- serializable representation: JSON.parse(JSON.stringify(instance)) must work
- non-exhaustive case handling: although exhaustive case handling can be seen as an advantage,
because the library prevents you from forgetting to handle a case, I actually prefer to be
able to handle only some cases and ignore the others
- default case handling: be able to define a handler that gets called if a case does not
match any of the handlers that you have defined.

All of the similar libraries that I looked at matched some, but not all, of those requirements:

- [stags](https://npmjs.com/package/stags) (repo [here](https://gitlab.com/JAForbes/static-sum-type))
- [daggy](https://github.com/fantasyland/daggy)
- [@joakin/sum-types](https://github.com/joakin/sum-types)
- [results](https://github.com/uniphil/results)
- [sum-types](https://github.com/geigerzaehler/sum-types)
- [tagged-union](https://github.com/quadrupleslap/union-js#readme)
- [union-type](https://github.com/paldepind/union-type)

I give credit to the libraries above. They are excellent work and definitely do more robust
verifications of your code than what I provide here.

Although the initial version of `static-tagged-union` did no verifications, the current version
provides **optional** checking that:

- the case handlers match the case type (see `foldChecked`, below)
- the case handlers match _all_ the cases of the case type (see `foldStrict`, below)

## Installation

Using `npm`:

```
npm i static-tagged-union
```

Using a `script` tag:

```
<script src="https://unpkg.com/static-tagged-union"></script>
```

Using the `script` tag exposes a `TaggedUnion` global, under which `TaggedUnion`, `fold`, etc.
are provided.

## API

- `TaggedUnion(listOfCases)`
- `fold(handlerObject)(caseInstance)`
- `cases(listOfCases)(handlerFunction)`
- `TaggedUnionChecked(type, listOfCases)`
- `foldChecked(handlerObject)(checkedCaseInstance)`
- `foldStrict(handlerObject)(checkedCaseInstance)`

That is the core API. For convenience, there is also `Maybe`:

- `Maybe.N(params)`, `Maybe.Y(params)`
- `bifold(fn, fy)` -- shortcut for `fold({ N: fn, Y: fy })`
- `map(fn)(maybeInstance)`
  - if `maybeInstance` is `N`, returns `maybeInstance`
  - if `maybeInstance` is `Y`, returns `Maybe.Y(fn(maybeInstance.params))`
- `unless(fn)(maybeInstance)`
  - if `maybeInstance` is `N`, returns `Maybe.N(fn(maybeInstance.params))`
  - if `maybeInstance` is `Y`, returns `maybeInstance`
- `bimap(fn, fy)`: shortcut for
```javascript
    fold({
      N: params => Maybe.N(fn(params)),
      Y: params => Maybe.Y(fy(params))
    })
```
- `contains(caseInstance)([caseInstance0, caseInstance1, ...])`
  - if one of the caseInstances in the array is the same case as `caseInstance`, returns `Maybe.Y(params)`, where `params` is the params contained by the first match
  - otherwise, returns `Maybe.N()`

## Usage

### Define a tagged union:

```javascript
const Route = TaggedUnion(["Home", "Profile", "Login"])
```

The single argument to `TaggedUnion` is an array of strings defining the cases for the type.
These will be properties of the returned object (`Route` in this example), and so the strings
must be valid to be used as object properties.

### Create instances of the tagged union:

```javascript
const route1 = Route.Home()
const route2 = Route.Profile({ id: 42 })
```

For each case that you provided when creating the tagged union, you get a function that creates
an instance. The function accepts a single optional argument that becomes the params stored in
the instance. Each instance is a plain JavaScript object of the form `{ id: ..., params: ... }`

### Use `fold` to handle cases:

```javascript
fold({
  Home: () => "Home",
  Profile: ({ id }) => `Profile ${id}`
})(route2)

// Returns "Profile 42"
```

You can provide just the cases you want to handle. If there is no match, the call returns
`undefined`:

```javascript
fold({
  Home: () => "Home"
})(route2)

// Returns undefined
```

You can also use `_` to indicate a default handler that gets called when there is no match:

```javascript
fold({
  Home: () => "Home",
  _: () => "No match was found"
})(route2)

// Returns "No match was found"
```

If you want to handle multiple cases in the same way, use `cases` for convenience:

```javascript
fold(cases(["Home", "About"])(() => "Result"))

fold({
  ...cases(["Home", "About"])(() => "Result"),
  User: () => "User",
  _: () => "No match found"
})
```

Instead of `{...cases()}`, you can also pass multiple handler objects to `fold`:

```javascript
fold(
  cases(["Home", "About"])(() => "Result"),
  { User: () => "User",
    _: () => "No match found"
  }
)
```

Credit: thank you [James Forbes](https://james-forbes.com) for this idea!

### TaggedUnionChecked, foldChecked, and foldStrict

The API so far does not do any verifications on cases and handlers. Optionally, you can ensure
that:

- the case handlers match the case type (see `foldChecked`, below)
- the case handlers match _all_ the cases of the case type (see `foldStrict`, below)

First, use `TaggedUnionChecked` to create the tagged union:

```javascript
const Route = TaggedUnionChecked(["Home", "Profile", "Login"])
```

Next, use `foldChecked` to make sure that your handlers match the case type:

```javascript
// This works fine:
foldChecked({
  Profile: ({ id }) => `Profile ${id}`
})(Route.Profile({ id: 42 }))

// This throws an error because `User` is not part of the cases for `Route`:
foldChecked({
  User: ({ id }) => `User ${id}`
})(Route.Profile({ id: 42 }))
```

Finally, use `foldStrict` to make the same verifications as `foldChecked` **plus** requiring that
the handler handles **all** the cases of the type. Note that `_` cannot be used here; instead, use
`cases` to handle multiple cases.

```javascript
// This works fine:
foldStrict({
  Home: () => "Home",
  Profile: ({ id }) => `Profile ${id}`,
  Login: () => "Login"
})(Route.Profile({ id: 42 }))

// This also works fine:
foldStrict(
  cases(["Home", "Login"])(() => "Page"),
  { Profile: ({ id }) => `Profile ${id}` }
)(Route.Profile({ id: 42 }))

// This throws an error because `Login` is not handled:
foldStrict({
  Home: () => "Home",
  Profile: ({ id }) => `Profile ${id}`
})(Route.Profile({ id: 42 }))
```

### Use `Maybe` for convenience:

Whenever you have a value that can be true/false, present/absent, and so on, you can use
`Maybe.Y` and `Maybe.N`:

```javascript
let data = Maybe.N()
// later...
data = Maybe.Y({ things: ... })
```

If you like, you can define an alias:

```javascript
const Loaded = Maybe

let data = Loaded.N()
// later...
data = Loaded.Y({ things: ... })
```

As a shortcut to `fold({ N: () => ..., Y: params => ... })`, you can use `bifold`:

```javascript
bifold(
  () => "Loading, please wait...",
  ({ things }) => `Here are the things: ${things}`
)
```

Note that `N` accepts params as well. For example, you might use this for an error message.

`Maybe` can also be used to denote the presence or absence of a value, and provide a convenient
way to operate on a value only if it is present. Use `map` for this:

```javascript
const name = getName() // returns Maybe.N or Maybe.Y
const upper = map(str => str.toUpperCase())(name) // only if name is present
bifold(
  () => "No name given.",
  name => `Hello, ${name}` // Hello, FRED
)(upper)
```

Finally, you can do something with the params in `N` and something with the params in `Y`
with `bimap`:

```javascript
const name = getName() // returns Maybe.N or Maybe.Y
const converted = bimap(
  err => `Error message: ${err}`,
  name => name.toUpperCase()
)
bifold(
  msg => console.err(msg),
  name => `Hello, ${name}`
)(converted)
```

Note that `Maybe`, `map`, `bimap`, and `bifold` are all just convenience shortcuts. You can
achieve the same with just `TaggedUnion` and `fold`.

## Credits

Special thanks to [James Forbes](https://twitter.com/james_a_forbes) for
[static-sum-type](https://gitlab.com/JAForbes/static-sum-type) and
[stags](https://www.npmjs.com/package/stags). Definitely check those out if you want static
tagged unions with verifications for types and exhaustive case handling.

The [readme for stags](https://www.npmjs.com/package/stags#what-is-it) also gives a great
explanation of why the `Maybe` type is so useful.

----

_static-tagged-union is developed by [foxdonut](https://github.com/foxdonut)
([@foxdonut00](http://twitter.com/foxdonut00)) and is released under the MIT license._
