/* eslint-env jest */

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
} from '../src/index';

const Route = TaggedUnion(['Home', 'Profile', 'Login', 'User']);

const route1 = Route.Home();
const route2 = Route.Profile({ id: 42 });
const route3 = Route.Login(45, 48);
const route4 = Route.User({ id: 43 });

const fold1 = fold({
  Home: () => 'Home',
  Profile: ({ id }) => `Profile ${id}`
});

const fold2 = fold({
  Home: () => 'Home',
  Login: (id) => `Profile ${id}`
});

const fold3 = fold({
  Home: () => 'Home',
  _: (params) => `Unmatched ${params}`
});

const fold4 = fold({
  Home: () => 'Home',
  _: () => 'Not found'
});

const fold5 = fold(cases(['Login', 'Profile'])(({ id }) => `User ${id}`));

const fold6 = fold({
  Home: () => 'Home',
  ...cases(['Profile', 'User'])(({ id }) => `User ${id}`),
  _: () => 'Not found'
});

const fold7 = fold(
  { Home: () => 'Home' },
  cases(['Profile', 'User'])(({ id }) => `User ${id}`),
  { _: () => 'Not found' }
);

const Data = TaggedUnionChecked('Data', ['None', 'Loading', 'Loaded']);
const Other = TaggedUnionChecked('Other', ['One', 'Two']);

const foldChecked1 = foldChecked({
  None: () => 'No data loaded',
  Loading: () => 'Loading, please wait'
});

const foldChecked2 = foldChecked({
  Nothing: () => 'Nothing'
});

const invalidFoldChecked2 = () => {
  try {
    foldChecked2(Data.Loading());
    return 'should have thrown an error';
  } catch (e) {
    return e;
  }
};

const invalidFoldChecked3 = () => {
  try {
    foldChecked1(Other.One());
    return 'should have thrown an error';
  } catch (e) {
    return e;
  }
};

const foldStrict1 = foldStrict({
  None: () => 'No data loaded',
  Loading: () => 'Loading, please wait',
  Loaded: () => 'Data loaded'
});

const foldStrict2 = foldStrict({
  Nothing: () => 'Nothing'
});

const invalidFoldStrict2 = () => {
  try {
    foldStrict2(Data.Loading());
    return 'should have thrown an error';
  } catch (e) {
    return e;
  }
};

const invalidFoldStrict3 = () => {
  try {
    foldStrict1(Other.One());
    return 'should have thrown an error';
  } catch (e) {
    return e;
  }
};

const foldStrict4 = foldStrict({
  Loading: () => 'Loading, please wait'
});

const invalidFoldStrict4 = () => {
  try {
    foldStrict4(Data.Loading());
    return 'should have thrown an error';
  } catch (e) {
    return e;
  }
};

const unloaded = Maybe.N();
const unloadedWithMessage = Maybe.N({ error: 'timeout' });
const loaded = Maybe.Y({ data: 'data' });

describe('static-tagged-union', () => {
  describe('serialized', () => {
    it('basic', () => {
      expect(route2).toEqual({ id: 'Profile', params: { id: 42 } });
    });

    it('alwaysParams', () => {
      expect(route1).toEqual({ id: 'Home', params: {} });
    });

    it('withFalse', () => {
      expect(Route.Home(false)).toEqual({ id: 'Home', params: false });
    });

    it('withZero', () => {
      expect(Route.Home(0)).toEqual({ id: 'Home', params: 0 });
    });

    it('withEmptyArray', () => {
      expect(Route.Home([])).toEqual({ id: 'Home', params: [] });
    });
  });

  describe('fold', () => {
    it('basic', () => {
      expect(fold1(route1)).toEqual('Home');
    });

    it('withParams', () => {
      expect(fold1(route2)).toEqual('Profile 42');
    });

    it('withJustFirstParams', () => {
      expect(fold2(route3)).toEqual('Profile 45');
    });

    it('withNoMatch', () => {
      expect(fold1(route3)).toEqual(null);
    });

    it('withDefault', () => {
      expect(fold3(route3)).toEqual('Unmatched 45');
    });

    it('withSerialized', () => {
      expect(fold1({ 'id': 'Profile', 'params': { 'id': '24' } })).toEqual('Profile 24');
    });

    it('withNull', () => {
      expect(fold2(null)).toEqual(null);
    });

    it('withUndefined', () => {
      expect(fold2(undefined)).toEqual(null);
    });

    it('withNullAndDefaultHandler', () => {
      expect(fold4(null)).toEqual('Not found');
    });

    it('withUndefinedAndDefaultHandler', () => {
      expect(fold4(undefined)).toEqual('Not found');
    });

    it('withJustCases', () => {
      expect(fold5(route2)).toEqual('User 42');
    });

    it('withCasesAndHome', () => {
      expect(fold6(route1)).toEqual('Home');
    });

    it('withCasesAndUser', () => {
      expect(fold6(route4)).toEqual('User 43');
    });

    it('withMultipleCasesAndHome', () => {
      expect(fold7(route1)).toEqual('Home');
    });

    it('withMultipleCasesAndUser', () => {
      expect(fold7(route4)).toEqual('User 43');
    });
  });

  describe('foldChecked', () => {
    it('successful', () => {
      expect(foldChecked1(Data.Loading())).toEqual('Loading, please wait');
    });

    it('invalidHandler', () => {
      expect(invalidFoldChecked2()).toEqual('Invalid handler Nothing for Data None,Loading,Loaded');
    });

    it('invalidCase', () => {
      expect(invalidFoldChecked3()).toEqual('Invalid handler None for Other One,Two');
    });
  });

  describe('foldStrict', () => {
    it('successful', () => {
      expect(foldStrict1(Data.Loading())).toEqual('Loading, please wait');
    });

    it('invalidHandler', () => {
      expect(invalidFoldStrict2()).toEqual('Invalid handler Nothing for Data None,Loading,Loaded');
    });

    it('invalidCase', () => {
      expect(invalidFoldStrict3()).toEqual('Invalid handler None for Other One,Two');
    });

    it('incompleteHandler', () => {
      expect(invalidFoldStrict4()).toEqual('Cases not handled for Data: None,Loaded');
    });
  });

  describe('maybe', () => {
    it('foldN', () => {
      expect(fold({ N: () => 'Nothing', Y: () => 'Something' })(unloaded)).toEqual('Nothing');
    });

    it('foldNWithParams', () => {
      expect(
        fold({ N: ({ error }) => `Nothing: ${error}`, Y: () => 'Something' })(unloadedWithMessage))
        .toEqual('Nothing: timeout');
    });

    it('foldY', () => {
      expect(fold({ N: () => 'Nothing', Y: ({ data }) => `Something ${data}` })(loaded))
        .toEqual('Something data');
    });

    it('mapN', () => {
      expect(map(({ data }) => `${data} loaded`)(unloaded)).toEqual({ id: 'N', params: {} });
    });

    it('mapY', () => {
      expect(map(({ data }) => `${data} loaded`)(loaded))
        .toEqual({ id: 'Y', params: 'data loaded' });
    });

    it('bimapN', () => {
      expect(
        bimap(({ error }) =>
          `Not loaded: ${error}`, ({ data }) => `${data} loaded`)(unloadedWithMessage))
        .toEqual({ id: 'N', params: 'Not loaded: timeout' });
    });

    it('bimapY', () => {
      expect(bimap(({ error }) => `Not loaded: ${error}`, ({ data }) => `${data} loaded`)(loaded))
        .toEqual({ id: 'Y', params: 'data loaded' });
    });

    it('bifoldN', () => {
      expect(
        bifold(({ error }) =>
          `Not loaded: ${error}`, ({ data }) => `${data} loaded`)(unloadedWithMessage))
        .toEqual('Not loaded: timeout');
    });

    it('bifoldY', () => {
      expect(bifold(({ error }) => `Not loaded: ${error}`, ({ data }) => `${data} loaded`)(loaded))
        .toEqual('data loaded');
    });
  });

  describe('contains', () => {
    it('containsY', () => {
      expect(contains(Route.Profile())([Route.Home(), Route.Profile({ id: 42 })]))
        .toEqual({ id: 'Y', params: { id: 42 } });
    });

    it('containsN', () => {
      expect(contains(Route.Profile())([Route.Home(), Route.Login({ id: 42 })]))
        .toEqual({ id: 'N', params: {} });
    });
  });

  describe('unless', () => {
    it('unlessN', () => {
      expect(unless(() => 'data loaded')(unloaded))
        .toEqual({ id: 'N', params: 'data loaded' });
    });

    it('unlessY', () => {
      expect(unless(({ data }) => `${data} loaded`)(loaded))
        .toEqual({ id: 'Y', params: { data: 'data' } });
    });
  });
});
