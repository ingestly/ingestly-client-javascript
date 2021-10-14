const path = require('path');

module.exports = {
    mode: "production",
    entry: "./src/index.js",
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'ingestly.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules | docs)/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: [
                                "@babel/preset-env"
                            ]
                        }
                    }
                ]
            }
        ]
    },
    target: ["web", "es5"]
};