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

	let mapObjects = [{
			id: 1,
			lon: 56.83,
			lat: 60.60,
			address: 'ул. Куйбышева 55',
			markName: 'Метка 1',
			title: 'Точка',
			description: 'Я РОДИЛСЯ',
			info: 'ЗАКРОЙ МЕНЯ И УХОДИ НЕ ПОРТИ ПЕЙЗАЖ ПЛЗ',
			img: 'https://www.karusel-tv.ru/media/suit/image_in_broadcast/media/image/2011/08/22/60506/24_13140160941.jpg'
		}, {
			id: 2,
			lon: 56.82,
			lat: 60.59,
			address: 'ул. Куйбышева 45',
			markName: 'Метка 2',
			title: 'А я вторая точка',
			description: 'На меня тоже нажали',
			info: 'SCRRRAPAPAPA'
		}];

	getFromLocal();

	function doSearch() {


		myCollection.removeAll();

		for (let i = 0; i < mapObjects.length; i++) {
			buildPlacemark(mapObjects[i]);
		}

		function buildPlacemark(point) {
			const layout = ymaps.templateLayoutFactory.createClass(
				`<div class="item">
				<h3>{{properties.title}}</h3>
				<h3>{{properties.name}}</h3>
				<h3>{{properties.address}}</h3>
				<img src="{{properties.img}}">
				<p>{{properties.description}}</p>
				<a href="#" class="more-info" data-id="{{properties.id}}">Узнать подробнее</a>
				<button class="remove-placemark">{{properties.buttonText}}</button>
				</div>`, 
				{
					build: function() {
						layout.superclass.build.call(this);
						$('.remove-placemark').on('click', this.onRemove);
						$('.more-info').on('click', this.onMoreInfoClick);
						$('.close-btn').on('click', this.onBtnCloseClick);
					},
					clear: function() {
						$('.remove-placemark').off('click', this.onRemove);
						$('.more-info').off('click', this.onMoreInfoClick);
						$('.close-btn').off('click', this.onBtnCloseClick);
						layout.superclass.clear.call(this);
					},
					onRemove: function() {
						alert('Удаление метки с id ' + point.id);
						// post на сервер
						myCollection.remove(placemark);
					},
					onMoreInfoClick: function() {
						$('.info__text').html(point.info);
						$('.info').show();
					},
					onBtnCloseClick: function() {
						$('.info').hide();
					}
				});

			const placemark = new ymaps.Placemark([point.lon, point.lat], {
				iconContent: point.markName,
				title: point.title,
				name: point.name,
				address: point.address,
				description: point.description,
				img: point.img,
				id: '',
				buttonText: "Удалить метку"
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

		getCoords(obj.address).then(data => {
			if(!data) {
				alert('Неверный адрес');
				return;
			}
			obj.lon = data[0];
			obj.lat = data[1];
			mapObjects.push(obj);
			doSearch();
			saveInLocal();
			evt.target.reset();
		});
	};

	objectsForm.on('submit', onFormSubmit);
});