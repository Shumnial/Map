'use strict';

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const config = require(path.join(__dirname, 'config.json'));
const compileDir = path.join(__dirname, 'html');
const templateDir = path.join(__dirname, 'views');
const nunjucks = require('nunjucks');
const del = require('del');
const env = nunjucks.configure('views', {
    autoescape: false,
});
const generate = require('nanoid/generate');

let filters = require('./filters/filters');
let commonData = {};

filters.hash = generate('1234567890abcdef', 10);
filters.export = true;

_.each(filters, (func, name) => {
  if (name !== 'export') {
    env.addFilter(name, func);
  }
});

if (config.commonData) {
	_.forEach(config.commonData, name => {
		let d = JSON.parse(fs.readFileSync(path.join(__dirname, `datasource/${name}.json`)));
		commonData[name] = d
	});
}

if (!fs.existsSync(compileDir)) {
	fs.mkdirSync(compileDir);
}

(() => {
	// clean folder
	del.sync([`${compileDir}/*.html`]);

	_.forEach(config.pages, page => {
		let template, context, res, layout;
		layout = page.layout || config.defaultLayout;

		if (config.contentOnly) {
			layout = config.emptyLayout
		}

		template = fs.readFileSync(path.join(templateDir, `${page.name}.html`));

		context = {
			root: config.buildStatic,
		 	_pages: config.pages,
		 	_showPages: config.showPageList,
			_env: process.env.NODE_ENV,
		 	common: commonData,
		 	isExport: true,
		 	locals: {},
		 	storage: config.storage,
			layout
		}

		if (page.pageData) {
		 	_.forEach(page.pageData,  (v, k) => {
		 		let d = JSON.parse(fs.readFileSync(path.join(__dirname, 'datasource', `${v}.json`)));
		 		context[v] = d
		 	});
		}

		if (page.pageVars) {
		 	_.forEach(page.pageVars, (v, k) => {
		 		context.locals[k] = v
		 	});
		}

		res = nunjucks.render(path.join(templateDir, `${page.name}.html`), context);
		fs.writeFileSync(path.join(compileDir, `${page.name}.html`), res);
	});

	// compile default layout

	if (config.contentOnly) {
		const context = {
			root: config.buildStatic,
		 	isExport: true,
			_env: process.env.NODE_ENV,
		 	storage: config.storage
		}

		const template = fs.readFileSync(path.join(templateDir, config.defaultLayout));
		const result = nunjucks.render(path.join(templateDir, config.defaultLayout), context);
		fs.writeFileSync(path.join(compileDir, config.defaultLayout), result);
	}
})()
