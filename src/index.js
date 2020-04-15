export const TaggedUnion = tags => tags.reduce((result, id) => {
  result[id] = params => ({ id, params: params == null ? {} : params })
  return result
}, {})

const caseLookup = {}

export const TaggedUnionChecked = (type, tags) => {
  caseLookup[type] = []
  return tags.reduce((result, id) => {
    caseLookup[type].push(id)
    result[id] = params => ({ type, id, params: params == null ? {} : params })
    return result
  }, {})
}

const getHandlers = allHandlers =>
  allHandlers.reduce((result, handler) => Object.assign(result, handler), {})

export const fold = (...allHandlers) => cx => {
  const handlers = getHandlers(allHandlers)
  const match = handlers[cx && cx.id] || handlers["_"]
  if (match) {
    return match(cx && cx.params)
  }
  return null
}

const verifyChecked = (...allHandlers) => cx => {
  if (!cx.type) {
    throw "Invalid case, no type: " + JSON.stringify(cx)
  }

  const allCases = caseLookup[cx.type]
  const handlers = getHandlers(allHandlers)

  const invalidHandler = Object.keys(handlers).reduce(
    (result, key) => result || (!allCases.includes(key) && key), null)

  if (invalidHandler) {
    throw "Invalid handler " + invalidHandler + " for " + cx.type + " " + allCases
  }
}

const verifyStrict = (...allHandlers) => cx => {
  const allCases = caseLookup[cx.type]
  const handlerCases = Object.keys(getHandlers(allHandlers))

  const unhandledCases = allCases.reduce(
    (result, c) => result.concat(!handlerCases.includes(c) ? c : []), [])

  if (unhandledCases.length > 0) {
    throw "Cases not handled for " + cx.type + ": " + unhandledCases
  }
}

// Checks that handlers and case are in type.
export const foldChecked = (...allHandlers) => cx => {
  verifyChecked(...allHandlers)(cx)
  return fold(...allHandlers)(cx)
}

// Checks that handlers and case are in type, plus that all cases are handled.
export const foldStrict = (...allHandlers) => cx => {
  verifyChecked(...allHandlers)(cx)
  verifyStrict(...allHandlers)(cx)
  return fold(...allHandlers)(cx)
}

export const cases = tags => handler => tags.reduce((result, tag) => {
  result[tag] = handler
  return result
}, {})

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
