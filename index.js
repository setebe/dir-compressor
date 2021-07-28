"use strict";

const path = require("path");
const fs = require("fs");
const archiver = require("archiver");

class DirArchiver {
  /**
   * The constructor.
   * @param {string} directoryPath - the path of the folder to archive.
   * @param {string} zipPath - The path of the zip file to create.
   * @param {array} excludes - The name of the files and foldes to exclude.
   */
  constructor(directoryPath, zipPath, excludes, flat = true) {
    this.excludes = excludes;
    this.directoryPath = directoryPath;
    this.zipPath = zipPath;
    this.flat = flat;
    if (this.flat) {
      this.zipPathPrefix = directoryPath.replace("./", "").split("/")[0];
      this.zipPathPrefix2 = directoryPath.replace("./", "").split("/")[1];
      if (this.zipPathPrefix == ".") {
        this.zipPathPrefix = "";
      }
      if (this.zipPathPrefix2 == ".") {
        this.zipPathPrefix2 = "";
      }
    }
  }

  /**
   * Recursively traverse the directory tree and append the files to the archive.
   * @param {string} directoryPath - The path of the directory being looped through.
   */
  traverseDirectoryTree(directoryPath) {
    const files = fs.readdirSync(directoryPath);
    for (const i in files) {
      const currentPath = directoryPath + "/" + files[i];
      const stats = fs.statSync(currentPath);
      const relativePath = path.relative(process.cwd(), currentPath);
      const isExcluded = this.excludes.includes(directoryPath) || this.excludes.includes(files[i]);

      if (stats.isFile() && !isExcluded) {
        let targetPath = currentPath;
        if (this.flat) {
          let dirs = currentPath.replace("./", "").split("/");
          targetPath = targetPath.replace("./", "");
          if (dirs.length > 1) {
            targetPath = targetPath.replace(this.zipPathPrefix, "");
            targetPath = targetPath.replace(this.zipPathPrefix2, "");
           }
        }
        this.archive.file(currentPath, {
          name: `${targetPath}`,
        });
        // console.log(`Adding File:`)
        // console.log(`${currentPath}\n${targetPath}`)
      } else if (stats.isDirectory() && !this.excludes.includes(relativePath)) {
        // console.log(`Adding Directory:${currentPath}`)
        this.traverseDirectoryTree(currentPath);
      }
    }
  }

  prettyBytes(bytes) {
    if (bytes > 1000 && bytes < 1000000) {
      return Math.round((bytes / 1000 + Number.EPSILON) * 100) / 100 + " KB";
    }
    if (bytes > 1000000 && bytes < 1000000000) {
      return Math.round((bytes / 1000000 + Number.EPSILON) * 100) / 100 + " MB";
    }
    if (bytes > 1000000000) {
      return Math.round((bytes / 1000000000 + Number.EPSILON) * 100) / 100 + " GB";
    }
    return bytes + " bytes";
  }

  createZip() {
    const self = this;

    if (fs.existsSync(this.zipPath)) {
      fs.unlinkSync(this.zipPath);
    }

    this.output = fs.createWriteStream(this.zipPath);
    this.archive = archiver("zip", {
      zlib: { level: 9 },
    });

    console.log(`Creating: ${path.resolve(self.zipPath)} ....`);

    this.archive.on("warning", function (err) {
      if (err.code === "ENOENT") {
        console.log(err);
      } else {
        throw err;
      }
    });

    this.archive.on("error", function (err) {
      throw err;
    });

    this.archive.pipe(this.output);
    this.traverseDirectoryTree(this.directoryPath);
    this.archive.finalize();
    this.output.on("close", function () {
      console.log(`Created: ${path.resolve(self.zipPath)} of ${self.prettyBytes(self.archive.pointer())}`);
    });
  }
}
module.exports = DirArchiver;
