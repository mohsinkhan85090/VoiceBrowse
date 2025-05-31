const path = require("path")
const CopyPlugin = require("copy-webpack-plugin");
const HtmlPlugin = require('html-webpack-plugin')

module.exports = {
    mode: "development",
    devtool: 'cheap-module-source-map', // to avoid eval function error
    entry: {
        index: path.resolve('./src/components/index.js'),
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/, // .js and .jsx files
                exclude: /node_modules/, // excluding the node_modules folder
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-react"],
                        plugins: ['@babel/plugin-transform-runtime']
                    }
                },

            },
            {
                test: /\.(c)ss$/, // styles files
                use: ["style-loader", "css-loader", "sass-loader"],
            },
            {
                test: /\.(png|woff|woff2|eot|ttf|svg)$/, // to import images and fonts
                loader: "url-loader",
                options: { limit: false },
            }
        ]
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve('src/static'),
                    to: path.resolve('dist')
                }
            ],
        }),
        ...getHtmlPlugins([   // taking all the entry points
            'index'
        ])
    ],
    devServer: {
        host: 'localhost',
        port: 3030, // you can change the port
        historyApiFallback: true,
        open: true
    },
    resolve: {
        extensions: ['.js', '.jsx']
    },
    output: {
        path: path.join(__dirname, "/dist"),
        filename: '[name].js',
        clean: true
    },
    optimization: {     // To split all jsx into multiple chunk of files we use this
        splitChunks: {
            chunks: 'all'
        }
    }
};



function getHtmlPlugins(chunks) {
    return chunks.map(chunk => new HtmlPlugin({
        title: "Mohsin's Extension",
        filename: `${chunk}.html`,
        chunks: [chunk]
    }))
}
//From the HtmlPlugin the chunks(react component) is taken and converts the js or jsx into a simple html file to feed the browser