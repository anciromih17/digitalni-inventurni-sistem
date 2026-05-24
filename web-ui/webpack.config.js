const HtmlWebpackPlugin = require("html-webpack-plugin");
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");

const deps = require("./package.json").dependencies;
const isDevServer = process.argv.includes("serve");

module.exports = {
  output: {
    publicPath: isDevServer ? "http://localhost:3000/" : "auto",
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
  devServer: {
    port: 3000,
    historyApiFallback: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "shell",
      remotes: {
        inventory: isDevServer
          ? "inventory@http://localhost:3001/remoteEntry.js"
          : "inventory@/inventory-remote/remoteEntry.js",
        reservations: isDevServer
          ? "reservations@http://localhost:3002/remoteEntry.js"
          : "reservations@/reservations-remote/remoteEntry.js",
        users: isDevServer
          ? "users@http://localhost:3003/remoteEntry.js"
          : "users@/users-remote/remoteEntry.js",
      },
      shared: {
        ...deps,
        react: {
          singleton: true,
          requiredVersion: deps.react,
        },
        "react-dom": {
          singleton: true,
          requiredVersion: deps["react-dom"],
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
  ],
};
