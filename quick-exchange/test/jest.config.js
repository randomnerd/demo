const tsConfig = require('./tsconfig').compilerOptions;

tsConfig.baseUrl = "../src";
module.exports = {
    rootDir: 'test',
    testRegex: 'spec.ts$',
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },
    globals: {
        'ts-jest': {
            tsConfig,
            diagnostics: false,
            compiler: 'ttypescript',
        }
    },
    coverageDirectory: '../coverage',
    moduleFileExtensions: [
        'js',
        'json',
        'ts'
    ],
    moduleNameMapper: { '^~(.*)$': '<rootDir>/../src/$1' }
};
