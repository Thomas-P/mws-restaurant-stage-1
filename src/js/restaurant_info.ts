let restaurantLocal;
let restaurantMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    initMap();
});

/**
 * Initialize leaflet map
 */
const initMap = async () => {
    const restaurant = await fetchRestaurantFromURL();
    if (restaurant) {
        restaurantMap = L.map('map', {
            center: [restaurant.latlng.lat, restaurant.latlng.lng],
            zoom: 16,
            scrollWheelZoom: false
        });
        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
            mapboxToken: 'pk.eyJ1IjoidHAxMjM0IiwiYSI6ImNqajRwY2tzYTFyZHUzdm10aXhiMmNpbG0ifQ.C3DNbn73iF-bJ94zpuzBTA',
            maxZoom: 18,
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            id: 'mapbox.streets'
        }).addTo(restaurantMap);
        fillBreadcrumb();
        DBHelper.mapMarkerForRestaurant(restaurant, restaurantMap);
    }
    /*
    const link = document
        .createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css';
    link.integrity = 'sha512-Rksm5RenBEKSKFjgI3a41vrjkw4EVPlJ3+OiI65vTjIdo9brlAacEuKOiQ5OFh7cOI1bkDwLqdLw3Zg0cRJAAQ==';
    link.crossOrigin = '';
    link.type = 'text/css';
    document.body.appendChild(link);
    */
};

/* window.initMapMain = () => {
  fetchRestaurantFromURL((error, restaurantLocal) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurantLocal.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(restaurantLocalLocal, self.map);
    }
  });
} */

/**
 * Get current restaurantLocal from page URL.
 */
const fetchRestaurantFromURL = async () => {
    if (restaurantLocal) { // restaurantLocal already fetched!
        return restaurantLocal;
    }
    const id = Number(getParameterByName('id'));
    if (!id) { // no id found in URL
        const error = 'No restaurantLocal id in URL';
        console.error(error);
        return null;
    } else {
        restaurantLocal = await DBHelper.fetchRestaurantById(String(id));
        fillRestaurantHTML();
        return restaurantLocal;
    }
};

/**
 * Create restaurantLocal HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = restaurantLocal) => {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const image: HTMLImageElement = <HTMLImageElement>document.getElementById('restaurant-img');
    image.className = 'restaurantLocal-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.alt = 'Photo of ' + restaurant.name;
    image.srcset = DBHelper.imageUrlForRestaurantLow(restaurant) + ' 400w';

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    // fill reviews
    fillReviewsHTML();
};

/**
 * Create restaurantLocal operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = restaurantLocal.operating_hours) => {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        hours.appendChild(row);
    }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = restaurantLocal.reviews) => {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
    const li = document.createElement('li');
    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    const date = document.createElement('p');
    date.innerHTML = review.date;
    li.appendChild(date);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
};

/**
 * Add restaurantLocal name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant = restaurantLocal) => {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerText = restaurant.name;
    li.setAttribute('aria-current', 'page');
    breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url = window.location.href) => {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
