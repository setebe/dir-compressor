const Zip = require("../index");
const makeDir = require("make-dir");
const del = require("del");

describe("Zipping directory's", () => {
  it("should zip files properly ", async () => {
    await del("./test/output");
    await makeDir("./test/output");
    const test = new Zip("test/test zip folder", "./test/output/test.zip", ["more files here"]);
    await test.createZip();
  });
});
