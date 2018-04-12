## [@amarajs/plugin-bundle](https://github.com/amarajs/plugin-bundle)

Plugin middleware for AmaraJS to add server-side bundling of JS files using [Rollup](https://github.com/rollup/rollup).

### Installation

`npm install --save @amarajs/plugin-bundle`

### Usage

```javascript
const Amara = require('@amarajs/core');
const AmaraPluginBundle = require('@amarajs/plugin-bundle');
const AmaraPluginEngineServer = require('@amarajs/plugin-engine-server');

const amara = Amara([
    AmaraPluginEngineServer(server),
    AmaraPluginBundle(require('rollup'))
]);
```

### Feature Type

The `@amarajs/plugin-bundle` middleware allows you to create features of type `"bundle"` and `"transform"`.

#### Return Values

For `{type: "bundle"}` features, your apply function should return a [rollup configuration object](https://rollupjs.org/guide/en#core-functionality).

```javascript
// convert any requests for bundle/<folder>.js into
// a bundle named <folder>.js, generated by transpiling
// all files in the features/<folder> directory

const path = require('path');
const transpile = require('rollup-plugin-buble')
const multi = require('rollup-plugin-multi-entry');
const dir = path.resolve();
const invalid = /[^_a-z0-9]+/g;

amara.add({
    type: 'bundle',
    targets: ['GET /bundle/*.js'],
    args: {
        folder: ({target}) => {
            const ext = path.extname(target.path);
            const folder = target.path.split('/').pop();
            return folder.replace(ext, '');
        }
    },
    apply: ({folder}) => ({
        input: `${dir}/features/${folder}/*.js`,
        output: {
            format: 'iife',
            name: folder.replace(invalid, '_')
        },
        plugins: [
            multi(),
            transpile()
        ]
    })
});
```

For `{type: "transform"}` features, your apply function should return a function that accepts a string parameter (the code to transform) and returns the transformed string.

```javascript
// strip all lines with the word 'password' on them,
// but only from JS files under the features folder
const rx = /^(.*?password.*?)$/mig;
amara.add({
    type: 'transform',
    targets: ['GET /features/**/*.js'],
    apply: () => (code) => {
        return code.replace(rx, '');
    }
});
```

### Applying Multiple Results to the Same Target

If multiple `{type: "bundle"}` features target the same request, the configuration objects will be merged, with later configurations winning over earlier configurations. Arrays will be concatenated and de-duplicated.

If multiple `{type: "transform"}` features target the same request, the functions will be invoked in the order added, with the results from the previous transformer being passed as input to the next transformer.

### Customization

You must provide an instance of `rollup` to the plugin factory.

### Contributing

If you have a feature request, please create a new issue so the community can discuss it.

If you find a defect, please submit a bug report that includes a working link to reproduce the problem (for example, using [this fiddle](https://jsfiddle.net/04f3v2x4/)). Of course, pull requests to fix open issues are always welcome!

### License

The MIT License (MIT)

Copyright (c) Dan Barnes

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.