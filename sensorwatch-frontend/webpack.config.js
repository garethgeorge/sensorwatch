const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/webapp/app.tsx",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.s[ac]ss$/i,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      stream: require.resolve("stream-browserify"),
    },
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "public/dist"),
  },
  devtool: "source-map",
  cache: {
    type: "filesystem",
    cacheDirectory: path.resolve(__dirname, ".temp_cache"),
  },
  optimization: {
    splitChunks: {
      chunks: "all",
    },
    usedExports: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: path.resolve(__dirname, "./public/index.html"),
      template: path.resolve(__dirname, "./src/webapp/index.template.html"),
    }),
  ],
};
