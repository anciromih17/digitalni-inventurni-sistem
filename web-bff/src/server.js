const app = require("./app");
const { port } = require("./config");

app.listen(port, () => {
  console.log(`Web BFF listening on port ${port}`);
});
