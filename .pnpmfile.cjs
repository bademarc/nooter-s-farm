// This file is used to handle specific dependencies in pnpm
function readPackage(pkg) {
  // Force specific versions of packages
  if (pkg.dependencies && pkg.dependencies['tailwindcss'] === undefined) {
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies['tailwindcss'] = '^3.4.17';
  }
  
  // Ensure postcss is available
  if (pkg.dependencies && pkg.dependencies['postcss'] === undefined) {
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies['postcss'] = '^8';
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
}; 