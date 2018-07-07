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
const fetchNeighborhoods = async () => {
    neighborhoodsLocal = await DBHelper.fetchNeighborhoods();
    fillNeighborhoodsHTML();
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = neighborhoodsLocal) => {
    const select:HTMLSelectElement = <HTMLSelectElement>document.getElementById('neighborhoods-select');
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
const fetchCuisines = async () => {
    cuisinesLocal = await DBHelper.fetchCuisines();
    fillCuisinesHTML();
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = cuisinesLocal) => {
    const select:HTMLSelectElement = <HTMLSelectElement>document.getElementById('cuisines-select');

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
const updateRestaurants = async () => {
    const cSelect:HTMLSelectElement = <HTMLSelectElement>document.getElementById('cuisines-select');
    const nSelect:HTMLSelectElement = <HTMLSelectElement>document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;


    const restaurants = await DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood);
    resetRestaurants(restaurants);
    fillRestaurantsHTML();
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
    if (markers) {
        markers.forEach(marker => marker.remove());
    }
    markers = [];
    restaurantList = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = restaurantList) => {
    const ul:HTMLUListElement = <HTMLUListElement>document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
        ul.appendChild(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
    DBHelper.lazyLoadInit();
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
    const li = document.createElement('li');
    const name = document.createElement('h1');
    if (restaurant.photograph) {
        const image = document.createElement('img');
        image.className = 'restaurant-img';
        image.src = '/img/placeholder.png';
        image.dataset.src = DBHelper.imageUrlForRestaurant(restaurant);
        image.alt = 'Photo of ' + restaurant.name;
        image.dataset.srcset = DBHelper.imageUrlForRestaurantLow(restaurant) + ' 400w';
        image.classList.add('lazy');
        li.appendChild(image);
    }
    name.innerHTML = restaurant.name;
    li.appendChild(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.appendChild(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.appendChild(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = DBHelper.urlForRestaurant(restaurant);
    li.appendChild(more);

    return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = restaurantList) => {
    restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, newListMap);
        markers.push(marker);
    });

};
/* addMarkersToMap = (restaurants = restaurantList) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */
