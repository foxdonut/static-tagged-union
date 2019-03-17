export const TaggedUnion = cases => cases.reduce((result, cx) => {
  result[cx] = value => ({ case: cx, value })
  return result
}, {})

export const fold = handlers => cx => {
  const match = handlers[cx && cx.case] || handlers["_"]
  if (match) {
    return match(cx && cx.value)
  }
}

export const Maybe = TaggedUnion(["N", "Y"])

export const map = fn => mb => fold({
  N: () => mb,
  Y: value => Maybe.Y(fn(value))
})(mb)

export const bimap = (fn, fy) => fold({
  N: value => Maybe.N(fn(value)),
  Y: value => Maybe.Y(fy(value))
})

export const bifold = (fn, fy) => fold({ N: fn, Y: fy })

export const unless = fn => mb => fold({
  N: value => Maybe.N(fn(value)),
  Y: () => mb
})(mb)

export const contains = cx => list => {
  const matches = list && list.filter(it => it.case === cx.case)
  return (matches && matches.length > 0) ? Maybe.Y(matches[0].value) : Maybe.N()
}
