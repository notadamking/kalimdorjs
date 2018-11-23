import * as fs from 'fs';
import * as path from 'path';
import {
  constructMatrixType,
  constructParamTable,
  filterByKind,
  filterByTag,
  getText,
  ifEquals,
  isSignatureValid,
  renderMethodReturnType,
  searchInterface,
  traverseArrayDefinition
} from '../../docs/processor';
const docsJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, './docs.json'), 'utf8')
);
/**
 * Mocking handlebar options
 */
const optionsMock = {
  fn: x => ({
    result: true,
    payload: x
  }),
  inverse: x => ({
    result: false,
    payload: x
  })
};

describe('docs:helper:ifEquals', () => {
  it('should return fn when the inputs are 1 and 1', () => {
    const result = ifEquals({}, 1, 1, optionsMock).result;
    expect(result).toBe(true);
  });

  it('should return inverse when the inputs are 1 and 2', () => {
    const result = ifEquals({}, 1, 2, optionsMock).result;
    expect(result).toBe(false);
  });

  it('should return fn when the two input objects are same', () => {
    const result = ifEquals({}, { z: 1 }, { z: 1 }, optionsMock).result;
    expect(result).toBe(true);
  });

  it('should return inverse when the two input objects are not same', () => {
    const result = ifEquals({}, { z: 1 }, { z: 2 }, optionsMock).result;
    expect(result).toBe(false);
  });
});

describe('docs:helper:filterByKind', () => {
  const fakePayload = [
    // Constructor
    {
      id: 724,
      name: 'zzzz',
      kind: 32,
      kindString: 'Constructor',
      flags: {},
      comment: {
        shortText: 'model training epochs'
      },
      sources: [
        {
          fileName: 'linear_model/stochastic_gradient.ts',
          line: 126,
          character: 10
        }
      ],
      type: {
        type: 'intrinsic',
        name: 'number'
      }
    },
    // Public var
    {
      id: 725,
      name: 'weights',
      kind: 32,
      kindString: 'Variable',
      flags: {
        isPublic: true
      },
      comment: {
        shortText: 'Model training weights'
      },
      sources: [
        {
          fileName: 'linear_model/stochastic_gradient.ts',
          line: 130,
          character: 11
        }
      ],
      type: {
        type: 'array',
        elementType: {
          type: 'intrinsic',
          name: 'number'
        }
      }
    }
  ];
  it('should filter all public Variables', () => {
    const result = filterByKind(fakePayload, optionsMock, 'Variable');
    expect(result).toMatchSnapshot();
  });

  it('should filter all constructor', () => {
    const result = filterByKind(fakePayload, optionsMock, 'Constructor');
    expect(result).toMatchSnapshot();
  });
});

describe('docs:helper:filterByTag', () => {
  const fakePayload = [
    {
      tag: 'example',
      text:
        "\nimport { SGDRegressor } from 'kalimdor/linear_model';\nconst reg = new SGDRegressor();\nconst X = [[0., 0.], [1., 1.]];\nconst y = [0, 1];\nreg.fit(X, y);\nreg.predict([[2., 2.]]); // result: [ 1.281828588248001 ]\n\n"
    },
    {
      tag: 'test',
      text: 'yo'
    }
  ];
  it('should find a tag example', () => {
    const result = filterByTag(fakePayload, optionsMock, 'example');
    expect(result).toMatchSnapshot();
  });

  it('should not find a tag zz', () => {
    const result = filterByTag(fakePayload, optionsMock, 'zz');
    expect(result.result).toBe(false);
  });
});

describe('docs:helper:searchInterface', () => {
  it('should find reference', () => {
    const result = searchInterface(docsJson, 920);
    const { id, name, kindString } = result;
    expect(id).toBe(920);
    expect(name).toBe('SVMOptions');
    expect(kindString).toBe('Interface');
  });
  it('should invalid ID reference return null', () => {
    const result = searchInterface(docsJson, 9999999);
    expect(result).toBe(null);
  });
});

describe('docs:helper:isSignatureValid', () => {
  it('should return true for the 2nd child', () => {
    const ele = docsJson.children[1].children[0].children[0];
    const result = isSignatureValid(ele, optionsMock);
    expect(result.result).toBe(true);
    expect(result.payload).toMatchSnapshot();
  });

  it('should return false for the 1st child', () => {
    const ele = docsJson.children[0];
    const result = isSignatureValid(ele, optionsMock);
    expect(result.result).toBe(false);
  });

  it('should return false for null input', () => {
    expect(() => isSignatureValid(null, optionsMock)).toThrow(
      "Cannot read property 'signatures' of null"
    );
  });
});

describe('docs:helper:traverseArrayDefinition', () => {
  const dummy1 = {
    type: 'array',
    elementType: {
      type: 'intrinsic',
      name: 'string'
    }
  };
  const dummy2 = {
    type: 'array',
    elementType: {
      type: 'array',
      elementType: {
        type: 'intrinsic',
        name: 'number'
      }
    }
  };

  it('should dummy1 return number[]', () => {
    const result = traverseArrayDefinition(dummy1);
    expect(result).toBe('string[]');
  });

  it('should dummy2 return number[][]', () => {
    const result = traverseArrayDefinition(dummy2);
    expect(result).toBe('number[][]');
  });

  it('should throw exceptions when invalid input is given', () => {
    expect(() => traverseArrayDefinition(null)).toThrow(
      "Cannot read property 'elementType' of null"
    );
    expect(() => traverseArrayDefinition(123)).toThrow(
      "Cannot read property 'name' of undefined"
    );
  });
});

describe('docs:helper:constructMatrixType', () => {
  it('should construct Type1DMatrix into number[]', () => {
    const matrixType = constructMatrixType('Type1DMatrix', [
      { name: 'number', type: 'number' }
    ]);
    expect(matrixType).toBe('number[]');
  });
  it('should construct Type2DMatrix into number[][]', () => {
    const matrixType = constructMatrixType('Type2DMatrix', [
      { name: 'number', type: 'number' }
    ]);
    expect(matrixType).toBe('number[][]');
  });
  it('should construct Type3DMatrix into number[][][]', () => {
    const matrixType = constructMatrixType('Type3DMatrix', [
      { name: 'number', type: 'number' }
    ]);
    expect(matrixType).toBe('number[][][]');
  });
  it('should construct Type4DMatrix into number[][][]', () => {
    const matrixType = constructMatrixType('Type4DMatrix', [
      { name: 'number', type: 'number' }
    ]);
    expect(matrixType).toBe('number[][][][]');
  });
  it('should throw an error on invalid inputs', () => {
    expect(() =>
      constructMatrixType(null, [{ name: 'number', type: 'number' }])
    ).toThrow('dim should not be null or undefined');
    expect(() => constructMatrixType('Type1DMatrix', null)).toThrow(
      'types cannot be empty!'
    );
  });
});

describe('docs:helper:getText', () => {
  const dummy1 = {
    comment: {
      text: 'dummy text',
      shortText: 'dummy shortText'
    }
  };
  const dummy2 = {
    comment: {
      text: null,
      shortText: 'dummy shortText'
    }
  };
  it('should dummy1 get text', () => {
    const text = getText(dummy1);
    expect(text).toBe('dummy text');
  });

  it('should dummy2 get shortText', () => {
    const shortText = getText(dummy2);
    expect(shortText).toBe('dummy shortText');
  });

  it('should throw an error for an invalid input', () => {
    expect(() => getText(null)).toThrow(
      'Param should not be null or undefined'
    );
    expect(() => getText(undefined)).toThrow(
      'Param should not be null or undefined'
    );
  });
});

describe('docs:helper:constructParamTable', () => {
  it('should build a table for param1', () => {
    const params =
      docsJson.children[3].children[0].children[1].signatures[0].parameters;
    const result = constructParamTable(params);
    expect(result).toMatchSnapshot();
  });

  it('should build a table for params with Type1DMatrix', () => {
    // Testing LinearRegression's fit function
    const params =
      docsJson.children[16].children[0].children[0].signatures[0].parameters;
    const result = constructParamTable(params);
    expect(result).toMatchSnapshot();
  });

  it('should build table for params with Type2DMatrix', () => {
    // Testing SGDClassifier's fit function
    const params =
      docsJson.children[17].children[2].children[5].signatures[0].parameters;
    const result = constructParamTable(params);
    expect(result).toMatchSnapshot();
  });

  it('should build table for params with Type2DMatrix of multiple types', () => {
    // Testing GaussianNB's fit function
    const params =
      docsJson.children[22].children[0].children[1].signatures[0].parameters;
    const result = constructParamTable(params);
    expect(result).toMatchSnapshot();
  });
});

describe('docs:helper:renderMethodReturnType', () => {
  it('should build a return type for any[]', () => {
    // Testing with random forest's predict
    const type =
      docsJson.children[8].children[1].children[6].signatures[0].type;
    const returnType = renderMethodReturnType(type);
    expect(returnType).toEqual('any[]');
  });
  it('should build a return type for void', () => {
    // Testing with random forest's fit
    const type =
      docsJson.children[8].children[1].children[4].signatures[0].type;
    const returnType = renderMethodReturnType(type);
    expect(returnType).toEqual('void');
  });

  it('should build a toJSON return type', () => {
    const type =
      docsJson.children[8].children[1].children[7].signatures[0].type;
    const returnType = renderMethodReturnType(type);
    expect(returnType).toMatchSnapshot();
  });
});
