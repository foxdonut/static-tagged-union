import {
  Maybe,
  TaggedUnion,
  TaggedUnionChecked,
  fold,
  foldChecked,
  foldStrict,
  cases,
  map,
  bimap,
  bifold,
  contains,
  unless
} from "../src/index"

const Route = TaggedUnion(["Home", "Profile", "Login", "User"])

const route1 = Route.Home()
const route2 = Route.Profile({ id: 42 })
const route3 = Route.Login(45, 48)
const route4 = Route.User({ id: 43 })

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
  _: params => `Unmatched ${params}`
})

const fold4 = fold({
  Home: () => "Home",
  _: () => "Not found"
})

const fold5 = fold(cases(["Login", "Profile"])(({ id }) => `User ${id}`))

const fold6 = fold({
  Home: () => "Home",
  ...cases(["Profile", "User"])(({ id }) => `User ${id}`),
  _: () => "Not found"
})

const fold7 = fold(
  { Home: () => "Home" },
  cases(["Profile", "User"])(({ id }) => `User ${id}`),
  { _: () => "Not found" }
)

const Data = TaggedUnionChecked("Data", ["None", "Loading", "Loaded"])
const Other = TaggedUnionChecked("Other", ["One", "Two"])

const foldChecked1 = foldChecked({
  None: () => "No data loaded",
  Loading: () => "Loading, please wait"
})

const foldChecked2 = foldChecked({
  Nothing: () => "Nothing"
})

const invalidFoldChecked2 = () => {
  try {
    foldChecked2(Data.Loading())
    return "should have thrown an error"
  } catch (e) {
    return e
  }
}

const invalidFoldChecked3 = () => {
  try {
    foldChecked1(Other.One())
    return "should have thrown an error"
  } catch (e) {
    return e
  }
}

const foldStrict1 = foldStrict({
  None: () => "No data loaded",
  Loading: () => "Loading, please wait",
  Loaded: () => "Data loaded"
})

const foldStrict2 = foldStrict({
  Nothing: () => "Nothing"
})

const invalidFoldStrict2 = () => {
  try {
    foldStrict2(Data.Loading())
    return "should have thrown an error"
  } catch (e) {
    return e
  }
}

const invalidFoldStrict3 = () => {
  try {
    foldStrict1(Other.One())
    return "should have thrown an error"
  } catch (e) {
    return e
  }
}

const foldStrict4 = foldStrict({
  Loading: () => "Loading, please wait",
})

const invalidFoldStrict4 = () => {
  try {
    foldStrict4(Data.Loading())
    return "should have thrown an error"
  } catch (e) {
    return e
  }
}

const unloaded = Maybe.N()
const unloadedWithMessage = Maybe.N({ error: "timeout" })
const loaded = Maybe.Y({ data: "data" })

export default {
  serialized: {
    basic: [
      route2,
      { id: "Profile", params: { id: 42 } }
    ],
    alwaysParams: [
      route1,
      { id: "Home", params: {} }
    ],
    withFalse: [
      Route.Home(false),
      { id: "Home", params: false }
    ],
    withZero: [
      Route.Home(0),
      { id: "Home", params: 0 }
    ],
    withEmptyArray: [
      Route.Home([]),
      { id: "Home", params: [] }
    ]
  },
  fold: {
    basic: [
      fold1(route1),
      "Home"
    ],
    withParams: [
      fold1(route2),
      "Profile 42"
    ],
    withJustFirstParams: [
      fold2(route3),
      "Profile 45"
    ],
    withNoMatch: [
      fold1(route3),
      null
    ],
    withDefault: [
      fold3(route3),
      "Unmatched 45"
    ],
    withSerialized: [
      fold1({ "id": "Profile", "params": { "id": "24" } }),
      "Profile 24"
    ],
    withNull: [
      fold2(null),
      null
    ],
    withUndefined: [
      fold2(undefined),
      null
    ],
    withNullAndDefaultHandler: [
      fold4(null),
      "Not found"
    ],
    withUndefinedAndDefaultHandler: [
      fold4(undefined),
      "Not found"
    ],
    withJustCases: [
      fold5(route2),
      "User 42"
    ],
    withCasesAndHome: [
      fold6(route1),
      "Home"
    ],
    withCasesAndUser: [
      fold6(route4),
      "User 43"
    ],
    withMultipleCasesAndHome: [
      fold7(route1),
      "Home"
    ],
    withMultipleCasesAndUser: [
      fold7(route4),
      "User 43"
    ]
  },
  foldChecked: {
    successful: [
      foldChecked1(Data.Loading()),
      "Loading, please wait"
    ],
    invalidHandler: [
      invalidFoldChecked2(),
      "Invalid handler Nothing for Data None,Loading,Loaded"
    ],
    invalidCase: [
      invalidFoldChecked3(),
      "Invalid handler None for Other One,Two"
    ]
  },
  foldStrict: {
    successful: [
      foldStrict1(Data.Loading()),
      "Loading, please wait"
    ],
    invalidHandler: [
      invalidFoldStrict2(),
      "Invalid handler Nothing for Data None,Loading,Loaded"
    ],
    invalidCase: [
      invalidFoldStrict3(),
      "Invalid handler None for Other One,Two"
    ],
    incompleteHandler: [
      invalidFoldStrict4(),
      "Cases not handled for Data: None,Loaded"
    ]
  },
  maybe: {
    foldN: [
      fold({ N: () => "Nothing", Y: () => "Something" })(unloaded),
      "Nothing"
    ],
    foldNWithParams: [
      fold({ N: ({ error }) => `Nothing: ${error}`, Y: () => "Something" })(unloadedWithMessage),
      "Nothing: timeout"
    ],
    foldY: [
      fold({ N: () => "Nothing", Y: ({ data }) => `Something ${data}` })(loaded),
      "Something data"
    ],
    mapN: [
      map(({ data }) => `${data} loaded`)(unloaded),
      { id: "N", params: {} }
    ],
    mapY: [
      map(({ data }) => `${data} loaded`)(loaded),
      { id: "Y", params: "data loaded" }
    ],
    bimapN: [
      bimap(
        ({ error }) => `Not loaded: ${error}`,
        ({ data }) => `${data} loaded`
      )(unloadedWithMessage),
      { id: "N", params: "Not loaded: timeout" }
    ],
    bimapY: [
      bimap(
        ({ error }) => `Not loaded: ${error}`,
        ({ data }) => `${data} loaded`
      )(loaded),
      { id: "Y", params: "data loaded" }
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
  },
  contains: {
    containsY: [
      contains(Route.Profile())([Route.Home(), Route.Profile({ id: 42 })]),
      { id: "Y", params: { id: 42 } }
    ],
    containsN: [
      contains(Route.Profile())([Route.Home(), Route.Login({ id: 42 })]),
      { id: "N", params: {} }
    ]
  },
  unless: {
    unlessN: [
      unless(() => "data loaded")(unloaded),
      { id: "N", params: "data loaded" }
    ],
    unlessY: [
      unless(({ data }) => `${data} loaded`)(loaded),
      { id: "Y", params: { data: "data" } }
    ]
  }
}
