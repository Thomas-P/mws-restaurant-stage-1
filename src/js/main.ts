let restaurantList,
    neighborhoodsLocal,
    cuisinesLocal;
let newListMap;
let markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    initMapMain(); // added
    fetchNeighborhoods();
    fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error) { // Got an error
            console.error(error);
        } else {
            neighborhoodsLocal = neighborhoods;
            fillNeighborhoodsHTML();
        }
    });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = neighborhoodsLocal) => {
    const select = document.getElementById('neighborhoods-select');
    neighborhoods.forEach(neighborhood => {
        const option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
    });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
    DBHelper.fetchCuisines((error, cuisines) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            cuisinesLocal = cuisines;
            fillCuisinesHTML();
        }
    });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = cuisinesLocal) => {
    const select = document.getElementById('cuisines-select');

    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
    });
};

/**
 * Initialize leaflet map, called from HTML.
 */
const initMapMain = () => {
    newListMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
    });
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoidHAxMjM0IiwiYSI6ImNqajRwY2tzYTFyZHUzdm10aXhiMmNpbG0ifQ.C3DNbn73iF-bJ94zpuzBTA',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
    }).addTo(newListMap);

    updateRestaurants();
};
/* window.initMapMain = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            resetRestaurants(restaurants);
            fillRestaurantsHTML();
        }
    })
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
    // Remove all restaurants
    restaurantList = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    if (self.markers) {
        self.markers.forEach(marker => marker.remove());
    }
    self.markers = [];
    restaurantList = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = restaurantList) => {
    const ul = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
};

/**
 * Create restaurantLocal HTML.
 */
const createRestaurantHTML = (restaurant) => {
    const li = document.createElement('li');

    const image = document.createElement('img');
    image.className = 'restaurantLocal-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.alt = 'Photo of ' + restaurant.name;
    image.srcset = DBHelper.imageUrlForRestaurantLow(restaurant) + ' 400w';
    li.append(image);

    const name = document.createElement('h1');
    name.innerHTML = restaurant.name;
    li.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = DBHelper.urlForRestaurant(restaurant);
    li.append(more);

    return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = restaurantList) => {
    restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, newListMap);
        marker.on("click", onClick);

        function onClick() {
            window.location.href = marker.options.url;
        }

        self.markers.push(marker);
    });

};
/* addMarkersToMap = (restaurants = restaurantList) => {
  restaurants.forEach(restaurantLocal => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurantLocal, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */

