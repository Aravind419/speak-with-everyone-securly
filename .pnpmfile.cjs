// .pnpmfile.cjs
// This file can be used to customize the installation process
// For now, we're just using it to ensure consistent installs
module.exports = {
  hooks: {
    readPackage(pkg) {
      // Ensure consistent versions for faster caching
      return pkg;
    }
  }
};