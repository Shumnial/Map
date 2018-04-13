$(function() {
	const objectsForm = $('.objects-form');
	let map;
	let myCollection;
	ymaps.ready(function() {
		map = new ymaps.Map('map', {
			center: [56.84, 60.60],
			zoom: 12,
			type: 'yandex#map'
		});

		myCollection = new ymaps.GeoObjectCollection();
		doSearch();
	});

	let mapObjects = [];

	getFromLocal();

	function doSearch() {
		myCollection.removeAll();

		for (let i = 0; i < mapObjects.length; i++) {
			buildPlacemark(mapObjects[i]);
		}

		function buildPlacemark(point) {
			const layout = ymaps.templateLayoutFactory.createClass(
				`<div class="item" data-id="{{properties.id}}" data-descr="{{properties.descr}}">
				<h3 class="item__name">{{properties.name}}</h3>
				<h3 class="item__address">{{properties.address}}</h3>
				<img src="{{properties.img}}">
				<a href="#" class="more-info">Узнать подробнее</a>
				<button class="edit-placemark">Изменить</button>
				<button class="remove-placemark">Удалить</button>
				</div>`, 
				{
					build: function() {
						layout.superclass.build.call(this);
						$('.remove-placemark').on('click', this.onRemove);
						$('.more-info').on('click', this.onMoreInfoClick);
						$('.close-btn').on('click', this.onBtnCloseClick);
						$('.edit-placemark').on('click', this.onBtnEditClick);
					},
					clear: function() {
						$('.remove-placemark').off('click', this.onRemove);
						$('.more-info').off('click', this.onMoreInfoClick);
						$('.close-btn').off('click', this.onBtnCloseClick);
						$('.edit-placemark').off('click', this.onBtnEditClick);
						layout.superclass.clear.call(this);
					},
					onRemove: function() {
						alert('Удаление метки с id ' + point.id);
						// post на сервер
						const data = localStorage.getItem('objects');
						const parsedData = JSON.parse(data);
						const id = $(this).closest('.item').attr('data-id');
						parsedData.forEach((el, i) => {
							if (id == el.id) {
								mapObjects.splice(i, 1);
								localStorage.setItem('objects', JSON.stringify(mapObjects));
							}
						});
						myCollection.remove(placemark);
					},
					onMoreInfoClick: function() {
						$('.info__text').html(point.info);
						$('.info').show();
					},
					onBtnCloseClick: function() {
						$('.info').hide();
					},
					onBtnEditClick: function() {
						const nameField = $('.objects-form__name');
						const addressField = $('.objects-form__address');
						const infoField = $('.objects-form__info');
						const itemName = $(this).siblings('.item__name').text();
						const itemAddress = $(this).siblings('.item__address').text();
						const itemDescr = $(this).closest('.item').attr('data-descr');
						nameField.val(itemName);
						addressField.val(itemAddress);
						infoField.val(itemDescr);
						$('.overlay').show();
						$('.objects-form').on('submit', () => {
							$('.overlay').hide();
							$(this).siblings('.remove-placemark').click();
						});
					}
				});

			const placemark = new ymaps.Placemark([point.lon, point.lat], {
				iconContent: point.markName,
				name: point.name,
				address: point.address,
				descr: point.info,
				img: point.img,
				id: point.id
			}, {
				balloonContentLayout: layout,
            preset: 'twirl#nightStretchyIcon' // иконка растягивается под контент
          });

			myCollection.add(placemark);
		}

		map.geoObjects.add(myCollection);

		if (mapObjects.length > '2') {
			map.setBounds(myCollection.getBounds());
		}
	};

	function getCoords (address) {
		const myGeocoder = ymaps.geocode(address);
		return myGeocoder.then(res => {
			const geoObj = res.geoObjects.get(0);
			const coords = geoObj ? geoObj.geometry.getCoordinates() : null;
			return coords;
		})
		.catch(err => console.log("err: ", err))
	};

	function saveInLocal() {
		localStorage.setItem('objects', JSON.stringify(mapObjects));
	};

	function getFromLocal() {
		const data = localStorage.getItem('objects');
		if (!data) {
			return;
		} else {
			mapObjects = JSON.parse(data);
		}
	};

	function onFormSubmit(evt) {
		evt.preventDefault();
		const obj = {};
		const result = $(this).serializeArray();
		result.forEach((el) => {
			obj[el.name] = el.value;
		});

		getCoords(`'г. Екатеринбург, ${obj.address}`).then(data => {
			if(!data) {
				alert('Неверный адрес');
				return;
			}
			obj.lon = data[0];
			obj.lat = data[1];
			obj.id = Date.now();
			mapObjects.push(obj);
			doSearch();
			saveInLocal();
			evt.target.reset();
		});
	};

	objectsForm.on('submit', onFormSubmit);
});