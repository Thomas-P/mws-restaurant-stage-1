/**
 * Common database helper functions.
 */
class DBHelper {

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        const port = 1337; // Change this to your server port
        return `http://localhost:${port}/restaurants/`;
    }

    static getRestaurantUrl(restaurant: string) {
        return `${this.DATABASE_URL}${restaurant}`;
    }

    /**
     * Fetch all restaurants.
     */
    private static async fetchRestaurants(id: string = null) {
        const url = id ? this.getRestaurantUrl(id) : this.DATABASE_URL;
        const response = await fetch(url);
        if (response.status == 200) {
            return await response.json();
        } else {
            throw new Error(response.statusText);
        }
    }

    /**
     * Fetch a restaurantLocal by its ID.
     */
    static fetchRestaurantById(id: string) {
        // fetch all restaurants with proper error handling.
        return this.fetchRestaurants(id)
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static async fetchRestaurantByCuisine(cuisine) {
        // Fetch all restaurants  with proper error handling
        const results = await this.fetchRestaurants();
        return results.filter(r => r.cuisine_type === cuisine);
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static async fetchRestaurantByNeighborhood(neighborhood) {
        // Fetch all restaurants
        const results = await this.fetchRestaurants();
        return results.filter(r => r.neighborhood === neighborhood);
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static async fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
        // Fetch all restaurants
        const results = await this.fetchRestaurants();
        return results
            .filter(r => neighborhood === 'all' || r.neighborhood === neighborhood)
            .filter(r => cuisine === 'all' || r.cuisine_type === cuisine);
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static async fetchNeighborhoods() {
        // Fetch all restaurants
        const results = await this.fetchRestaurants();
        return results
            .map((v, i) => results[i].neighborhood)
            .reduce((prev: string[], current: string) => {
                if (prev.indexOf(current) === -1) {
                    prev.push(current);
                }
                return prev;
            }, []);
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static async fetchCuisines() {
        // Fetch all restaurants
        const results = await this.fetchRestaurants();
        return results
            .map((v, i) => results[i].cuisine_type)
            .reduce((prev: string[], current: string) => {
                if (prev.indexOf(current) === -1) {
                    prev.push(current);
                }
                return prev;
            }, []);
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        return (`/img/${restaurant.photograph}.jpg`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurantLow(restaurant) {
        return (`/img/low-${restaurant.photograph}.jpg`);
    }

    /**
     * Map marker for a restaurantLocal.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        // https://leafletjs.com/reference-1.3.0.html#marker
        const marker = L.marker([restaurant.latlng.lat, restaurant.latlng.lng], {
            title: restaurant.name,
            alt: restaurant.name
        });
        marker.addEventListener('click', () => {
            document.location.href = DBHelper.urlForRestaurant(restaurant);
        });
        marker.addTo(map);
        return marker;
    }
}

