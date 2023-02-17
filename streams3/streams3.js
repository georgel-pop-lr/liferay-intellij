var fs = require('fs');
var path = require('path');
var streams2 = require('../streams2/streams2');
var util = require('util');

var getFilePath = streams2.getFilePath;
var isDirectory = streams2.isDirectory;
var isFile = streams2.isFile;
var isHidden = streams2.isHidden;
var isRepoModePull = streams2.isRepoModePull;

function getFolders(folderPath, maxDepth) {
	var folders = [];

	if (!isDirectory(folderPath)) {
		return folders;
	}

	folders.push(folderPath);

	var fileNames = fs.readdirSync(folderPath);

	for (var i = 0; i < fileNames.length; i++) {
		var fileName = fileNames[i];

		var filePath = getFilePath(folderPath, fileName);

		if (isDirectory(filePath) && !isHidden(filePath)) {
			folders.push(filePath);

			if (maxDepth > 0) {
				Array.prototype.push.apply(
					folders, getFolders(filePath, maxDepth - 1));
			}
		}
	}

	return folders;
};

function getModuleFolders(portalSourceFolder, moduleSourceFolder) {
	var moduleRootPath = path.relative(portalSourceFolder, moduleSourceFolder);
	var findResultFolders = getFolders(moduleRootPath, 5);

	var moduleFolders = [];

	for (var i = 0; i < findResultFolders.length; i++) {
		if (isModuleFolder(findResultFolders[i])) {
			moduleFolders.push(findResultFolders[i]);
		}
	}

	return moduleFolders;
};

function getModuleVersion(folder) {
	var bndPath = getFilePath(folder, 'bnd.bnd');
	var packageJsonPath = getFilePath(folder, 'package.json');

	var bundleName, bundleVersion;

	if (isFile(bndPath)) {
		var bndContent = fs.readFileSync(bndPath);

		var bundleNameRegex = /Bundle-SymbolicName: ([^\r\n]+)/g;
		var bundleVersionRegex = /Bundle-Version: ([^\r\n]+)/g;

		var bundleNameMatcher = bundleNameRegex.exec(bndContent);
		var bundleVersionMatcher = bundleVersionRegex.exec(bndContent);

		return {
			bundleSymbolicName: bundleNameMatcher ? bundleNameMatcher[1] : null,
			bundleVersion: bundleVersionMatcher ? bundleVersionMatcher[1] : null
		};
	}

	if (isFile(packageJsonPath)) {
		var packageJsonContent = fs.readFileSync(packageJsonPath);

		var packageJson = JSON.parse(packageJsonContent);

		var bundleName = null;

		if (packageJson.liferayTheme) {
			bundleName = packageJson.liferayTheme.distName;
		}

		if (!bundleName) {
			bundleName = packageJson.name;
		}

		bundleName = bundleName.substring(bundleName.lastIndexOf('/') + 1);

		return {
			bundleSymbolicName: bundleName,
			bundleVersion: packageJson.version
		};
	}

	return {};
};

function isModuleFolder(folder) {
	if ((folder.indexOf('/archetype-resources') != -1) || (folder.indexOf('/gradleTest') != -1)) {
		return false;
	}

	if (!isFile(getFilePath(folder, 'bnd.bnd')) && !isFile(getFilePath(folder, 'package.json'))) {
		return false;
	}

	if (!isDirectory(getFilePath(folder, 'src'))) {
		return false;
	}

	return true;
};

function readFileSync(filePath) {
	return fs.readFileSync(filePath);
};

exports.getModuleFolders = getModuleFolders;