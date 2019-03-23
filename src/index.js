export const TaggedUnion = cases => cases.reduce((result, id) => {
  result[id] = params => ({ id, params: params == null ? {} : params })
  return result
}, {})

export const fold = handlers => cx => {
  const match = handlers[cx && cx.id] || handlers["_"]
  if (match) {
    return match(cx && cx.params)
  }
}

export const Maybe = TaggedUnion(["N", "Y"])

export const map = fn => mb => fold({
  N: () => mb,
  Y: params => Maybe.Y(fn(params))
})(mb)

export const bimap = (fn, fy) => fold({
  N: params => Maybe.N(fn(params)),
  Y: params => Maybe.Y(fy(params))
})

export const bifold = (fn, fy) => fold({ N: fn, Y: fy })

export const unless = fn => mb => fold({
  N: params => Maybe.N(fn(params)),
  Y: () => mb
})(mb)

export const contains = cx => list => {
  const matches = list && list.filter(it => it.id === cx.id)
  return (matches && matches.length > 0) ? Maybe.Y(matches[0].params) : Maybe.N()
}
