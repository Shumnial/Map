const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const components = path.join(__dirname, '..', 'public/less/components/components.less');



function getComponentLocation (file) {
	const letter = file.slice(0, 2);
	let dir = false;
	let result = {};

	switch(letter) {
		case 'c-': 
		  dir = 'components'
			break
		case 'm-': 
		  dir = 'mixins'
			break
		case 'h-': 
		  dir = 'helpers'
		default: 
		  dir = 'components'
			break
	}

	const endpoint = path.join(__dirname, '..', 'public/less/', dir, dir + '.less');
	const endpointDir = path.join(__dirname, '..', 'public/less/', dir);
	const lessPath = path.join(__dirname, '..', 'public/less/', dir, file + '.less');

	try {
		const access = fs.accessSync(lessPath);

		if (!access) {
			result = {
				error: `Дратути!\n${lessPath}\nПохоже, что этот файл уже существует`}
		}
	} catch (err) {
		if(err) {
			if (err.code === 'ENOENT') {
				result = {
					endpoint, 
					lessPath, 
					endpointDir
				}
			} else {
				result = {error: `Что то не так с доступом к файлу\n ${lessPath}`}
			}
		}
	}

	return result;
}

/* GET home page. */

router.get('/add_less', (req, res, next) => {

	let fileName = req.query.id.replace(/\s+/g, ''),
			result = getComponentLocation(fileName),
			content = '';
			component = '';

	if (!result.error) {
		content = `.${fileName}{\n\n}`;
		component = `\n@import \'${fileName}\';`;
		fs.writeFile(result.lessPath, content, err => {
		  if (err) {
		  	throw err;
		  } else {
		  	fs.appendFile(result.endpoint, component, 'utf8', (err) => {
  				if(err) {
  					throw err;
  				}	
  			});
		  }
		});
	} 
  res.send(result);
});


module.exports = router;
