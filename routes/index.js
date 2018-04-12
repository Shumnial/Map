'use strict';

let fs = require('fs');
let path = require('path');
let express = require('express');
let router = express.Router();
let _ = require('lodash');
let config = require('../config.json');
let commonData = {};

if (config.commonData) {
	_.forEach(config.commonData, name => {
		let d = JSON.parse(fs.readFileSync(path.join(__dirname, '../datasource', `${name}.json`)));
		commonData[name] = d
	});
}

_.forEach(config.pages, page => {

	router.get(page.route, (req, res, next) => {

		let layout = page.layout || config.defaultLayout;
		
		let context = {
			root: config.devStatic,
			_pages: config.pages,
			_showPages: config.showPageList,
			locals: {},
			common: commonData,
			storage: `${config.devStatic}storage/`,
			_env: process.env.NODE_ENV,
			layout
		}

		if (page.pageData) {
			_.forEach(page.pageData,  (v, k) => {
				let d = JSON.parse(fs.readFileSync(path.join(__dirname, '../datasource', `${v}.json`)));
				context[v] = d
			});
		}

		if (page.pageVars) {
			_.forEach(page.pageVars, (v, k) => {
				context.locals[k] = v
			});
		}

		res.render(page.name, context)
	});

});

module.exports = router;
