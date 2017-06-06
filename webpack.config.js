const path = require('path');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
// const cssnano = require('cssnano');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const debug = process.env.NODE_ENV !== 'production';
const postCSSPlugins = [autoprefixer];

// if (!debug) {
//     postCSSPlugins.push(cssnano);
// }

const config = {
    context: __dirname,
    entry: './src/index',
    // devtool: debug ? 'eval' : 'cheap-module-source-map',
    devtool: debug ? 'eval-source-map' : 'cheap-module-source-map',

    output: {
        path: path.resolve(__dirname, 'src/dist'),
        filename: 'app.js'
        // sourceMapFilename: '[file].map'
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|dist|libs)/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['es2015', 'react', 'stage-1'],
                            plugins: [
                                'transform-decorators-legacy',
                                'transform-class-properties',
                                'react-html-attrs'
                            ]
                        }
                    },
                    {
                        loader: 'eslint-loader',
                        options: {
                            configFile: path.resolve(__dirname, '.eslintrc.json')
                        }
                    }
                ]
            },
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    use: [
                        'css-loader',
                        {
                            loader: 'postcss-loader',
                            options: {
                                config: {
                                    ctx: {
                                        autoprefixer: {},
                                        cssnano: {}
                                    }
                                },
                                plugins: postCSSPlugins
                            }
                        },
                        'sass-loader'
                    ]
                })
            },
            {
                test: /\.(jpg|png|gif)$/,
                use: 'file-loader'
            },
            {
                test: /\.(woff|woff2|eot|ttf|svg)$/,
                use: {
                    loader: 'url-loader',
                    options: {
                        name: '[name].[ext]',
                        limit: 100000
                    }
                }
            }
        ]
    },

    plugins: [
        new ExtractTextPlugin({ filename: 'base.css', allChunks: true }),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        }),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV)
            }
        })
    ]
};

if (!debug) {
    config.plugins = config.plugins.concat([
        new webpack.LoaderOptionsPlugin({
            minimize: true,
            debug: false
        }),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            beautify: false,
            mangle: {
                screw_ie8: true,
                keep_fnames: true
            },
            compress: {
                screw_ie8: true
            },
            comments: false,
            sourceMap: true
        })
    ]);
}

module.exports = config;
