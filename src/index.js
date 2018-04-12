const arr = '[object Array]';
const obj = '[object Object]';
const type = Object.prototype.toString;
const sep = /\\/g;

function merge(result, config) {
    Object.keys(config)
        .forEach(key => {
            const value = config[key];
            switch(type.call(value)) {
                case arr:
                    result[key] = (result[key] || []).concat(value);
                    result[key] = Array.from(new Set(result[key]));
                    break;
                case obj:
                    result[key] = merge(result[key] || {}, value);
                    break;
                default:
                    result[key] = value;
            }
        });
    return result;
}

module.exports = function AmaraPluginRollup(rollup) {

    return function createHandler(dispatch) {

        const transforms = new Set();

        function filter(ctx) {
            return {
                name: 'amarajs-filter',
                transform(code, id) {
                    if (id.startsWith('\0')) return;
                    return new Promise(resolve => {
                        dispatch({
                            type: 'bundle:transform',
                            payload: {ctx, code}
                        });
                        const queue = [];
                        transforms.forEach(function isMatch(feature) {
                            const payload = {
                                matches: false,
                                path: id.replace(sep, '/'),
                                method: ctx.method,
                                targets: feature.targets
                            };
                            dispatch({type: 'server:is-target-match', payload});
                            payload.matches && queue.push({feature, targets: [ctx]});
                        });
                        if (queue.length) {
                            ctx.state.code = code;
                            ctx.state.transform = resolve;
                            dispatch({type: 'core:enqueue-apply', payload: queue});
                        } else {
                            resolve({code});
                        }
                    });
                }
            };
        };

        function createBundle(configs, ctx) {
            const config = configs.reduce(merge, {});
            config.plugins.push(filter(ctx));
            rollup.rollup(config)
                .then(bundle => bundle.generate(config.output))
                .then(({code}) => {
                    ctx.type = 'text/javascript';
                    ctx.body = code;
                    ctx.state.resolve.bundle();
                });
        }

        function doTransform(transforms, ctx) {
            ctx.state.transform({code: transforms.reduce(function(result, fn) {
                return fn(result);
            }, ctx.state.code)});
        }

        function addTransformFeatures(feature) {
            if (feature.type === 'transform') {
                transforms.add(feature);
            }
        }

        return function handle(action) {
            switch (action.type) {
            case 'core:features-added':
                action.payload.forEach(addTransformFeatures);
                break;
            case 'core:apply-target-results':
                action.payload.bundle && action.payload.bundle.forEach(createBundle);
                action.payload.transform && action.payload.transform.forEach(doTransform);
                break;
            }
        };

    };

};
