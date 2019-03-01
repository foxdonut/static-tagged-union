import { Maybe, TaggedUnion, fold, map, bimap, bifold } from "../src/index"

const Route = TaggedUnion(["Home", "Profile", "Login"])

const route1 = Route.Home()
const route2 = Route.Profile({ id: 42 })
const route3 = Route.Login(45, 48)

const fold1 = fold({
  Home: () => "Home",
  Profile: ({ id }) => `Profile ${id}`
})

const fold2 = fold({
  Home: () => "Home",
  Login: id => `Profile ${id}`
})

const fold3 = fold({
  Home: () => "Home",
  _: value => `Unmatched ${value}`
})

const fold4 = fold({
  Home: () => "Home",
  _: () => "Not found"
})

const unloaded = Maybe.N()
const unloadedWithMessage = Maybe.N({ error: "timeout" })
const loaded = Maybe.Y({ data: "data" })

export default {
  serialized: [
    route2,
    { case: "Profile", value: { id: 42 } }
  ],
  fold: {
    basic: [
      fold1(route1),
      "Home"
    ],
    withValue: [
      fold1(route2),
      "Profile 42"
    ],
    withJustFirstValue: [
      fold2(route3),
      "Profile 45"
    ],
    withNoMatch: [
      fold1(route3),
      undefined
    ],
    withDefault: [
      fold3(route3),
      "Unmatched 45"
    ],
    withSerialized: [
      fold1({ "case": "Profile", "value": { "id": "24" } }),
      "Profile 24"
    ],
    withNull: [
      fold2(null),
      undefined
    ],
    withUndefined: [
      fold2(undefined),
      undefined
    ],
    withNullAndDefaultHandler: [
      fold4(null),
      "Not found"
    ],
    withUndefinedAndDefaultHandler: [
      fold4(undefined),
      "Not found"
    ]
  },
  maybe: {
    foldN: [
      fold({ N: () => "Nothing", Y: () => "Something" })(unloaded),
      "Nothing"
    ],
    foldNWithValue: [
      fold({ N: ({ error }) => `Nothing: ${error}`, Y: () => "Something" })(unloadedWithMessage),
      "Nothing: timeout"
    ],
    foldY: [
      fold({ N: () => "Nothing", Y: ({ data }) => `Something ${data}` })(loaded),
      "Something data"
    ],
    mapN: [
      map(({ data }) => `${data} loaded`)(unloaded),
      { case: "N", value: undefined }
    ],
    mapY: [
      map(({ data }) => `${data} loaded`)(loaded),
      { case: "Y", value: "data loaded" }
    ],
    bimapN: [
      bimap(
        ({ error }) => `Not loaded: ${error}`,
        ({ data }) => `${data} loaded`
      )(unloadedWithMessage),
      { case: "N", value: "Not loaded: timeout" }
    ],
    bimapY: [
      bimap(
        ({ error }) => `Not loaded: ${error}`,
        ({ data }) => `${data} loaded`
      )(loaded),
      { case: "Y", value: "data loaded" }
    ],
    bifoldN: [
      bifold(
        ({ error }) => `Not loaded: ${error}`,
        ({ data }) => `${data} loaded`
      )(unloadedWithMessage),
      "Not loaded: timeout"
    ],
    bifoldY: [
      bifold(
        ({ error }) => `Not loaded: ${error}`,
        ({ data }) => `${data} loaded`
      )(loaded),
      "data loaded"
    ]
  }
}

