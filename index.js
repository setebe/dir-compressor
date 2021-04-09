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
  }

  /**
   * Recursively traverse the directory tree and append the files to the archive.
   * @param {string} directoryPath - The path of the directory being looped through.
   */
  traverseDirectoryTree(directoryPath, level = 1) {
    const files = fs.readdirSync(directoryPath);
    for (const i in files) {
      const currentPath = directoryPath + "/" + files[i];
      const stats = fs.statSync(currentPath);
      const relativePath = path.relative(process.cwd(), currentPath);
      if (stats.isFile() && !this.excludes.includes(relativePath)) {
        let targetPath = currentPath;
        if (this.flat && level == 1) {
          let dirs = currentPath.split("/");
          if (dirs.length > 0) {
            dirs.shift();
            targetPath = dirs.join('/');
          }
        }
        this.archive.file(currentPath, {
          name: `${targetPath}`,
        });
      } else if (stats.isDirectory() && !this.excludes.includes(relativePath)) {
        this.traverseDirectoryTree(currentPath, level++);
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
    if (fs.existsSync(this.zipPath)) {
      fs.unlinkSync(this.zipPath);
    }
    this.output = fs.createWriteStream(this.zipPath);
    this.archive = archiver("zip", {
      zlib: { level: 9 },
    });

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

    const self = this;
    this.output.on("close", function () {
      console.log(`Created ${path.resolve(self.zipPath)} of ${self.prettyBytes(self.archive.pointer())}`);
    });
  }
}
module.exports = DirArchiver;
