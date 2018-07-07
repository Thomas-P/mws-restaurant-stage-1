/**
 * Common database helper functions.
 */
class DBHelper {
    private static VERSION = 7;
    private static REVIEWS = "reviews";
    private static REVIEW_SYNC = "review-sync";
    private static RESTAURANTS = "restaurants";
    private database: IDBDatabase;
    private static dbHelper: DBHelper;

    constructor() {
    }

    public static lazyLoadInit = () => {
        let lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));
        let active = false;

        const lazyLoad = function() {
            if (active === false) {
                active = true;

                setTimeout(function() {
                    lazyImages.forEach(function(lazyImage) {
                        if ((lazyImage.getBoundingClientRect().top <= window.innerHeight && lazyImage.getBoundingClientRect().bottom >= 0) && getComputedStyle(lazyImage).display !== "none") {
                            lazyImage.src = lazyImage.dataset.src;
                            lazyImage.srcset = lazyImage.dataset.srcset;
                            lazyImage.classList.remove("lazy");

                            lazyImages = lazyImages.filter(function(image) {
                                return image !== lazyImage;
                            });

                            if (lazyImages.length === 0) {
                                document.removeEventListener("scroll", lazyLoad);
                                window.removeEventListener("resize", lazyLoad);
                                window.removeEventListener("orientationchange", lazyLoad);
                            }
                        }
                    });

                    active = false;
                }, 200);
            }
        };

        document.addEventListener("scroll", lazyLoad);
        window.addEventListener("resize", lazyLoad);
        window.addEventListener("orientationchange", lazyLoad);
    };
    private static deleteDatabase(dbName: string) {
        return new Promise((resolve, reject) => {
            const DBDeleteRequest = window.indexedDB.deleteDatabase(dbName);

            DBDeleteRequest.onerror = function (event) {
                reject('Error deleting database.');
            };

            DBDeleteRequest.onsuccess = function (event) {
                resolve();
            };
        })
    }

    private static async postData(url = ``, data = {}) {
        try {
            // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
            const response = await fetch(url, {
                method: "POST", // *GET, POST, PUT, DELETE, etc.
                mode: "no-cors", // no-cors, cors, *same-origin
                cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
                credentials: "same-origin", // include, same-origin, *omit
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    // "Content-Type": "application/x-www-form-urlencoded",
                },
                redirect: "follow", // manual, *follow, error
                referrer: "no-referrer", // no-referrer, *client
                body: JSON.stringify(data), // body data type must match "Content-Type" header
            });
            return response.json();
        } catch (error) {
            console.error(`Fetch Error =\n`, error)
        }
    };

    private openDataBase(): Promise<IDBDatabase> {
        if (this.database) {
            return Promise.resolve(this.database);
        }
        return new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open("RestaurantDatabase", DBHelper.VERSION);
            request.onerror = (event) => {
                console.log(event);
                reject("No connection to database.");
            };
            request.onsuccess = (event) => {
                this.database = request.result;
                resolve(this.database);
            };
            request.addEventListener('upgradeneeded', async (event: IDBVersionChangeEvent) => {
                console.log('Updating database');
                /*for (let dbName of [DBHelper.REVIEWS, DBHelper.REVIEW_SYNC, DBHelper.RESTAURANTS]) {
                    await DBHelper.deleteDatabase(dbName);
                }*/
                const db = request.result;

                const sync = db.createObjectStore(DBHelper.REVIEW_SYNC, {
                    keyPath: "date"
                });
                const restaurants = db.createObjectStore(DBHelper.RESTAURANTS, {
                    keyPath: 'id'
                });
                const reviews = db.createObjectStore(DBHelper.REVIEWS, {
                    keyPath: 'id',
                });
            })
        })
    }

    /**
     * create a review and store them in the backend or in the sync database
     * @param {ReviewData} review
     * @returns {Promise<any>}
     */
    public static createReview(review: ReviewData) {
        return this.INSTANCE.saveReview(review);
    }

    /**
     * sync all data with the backend
     * @returns {Promise<boolean>}
     */
    public async syncReviews(): Promise<boolean> {
        const database = await this.openDataBase();
        return await new Promise<boolean>((resolve, reject) => {
            const cursor = database
                .transaction(DBHelper.REVIEW_SYNC, 'readwrite')
                .objectStore(DBHelper.REVIEW_SYNC).openCursor();
            cursor
                .addEventListener('success', async (event) => {
                    const cursor: IDBCursorWithValue = event.target['result'];
                    if (cursor) {
                        await this.saveReview(cursor.value, true);
                        await this.deleteSyncReview(cursor);
                        cursor.continue();
                    } else {
                        resolve(true);
                    }
                });
            cursor
                .addEventListener('error', (err) => reject(err));
        });
    }

    /**
     * delete a synced review
     * @param {IDBCursorWithValue} cursor
     * @returns {Promise<any>}
     */
    private async deleteSyncReview(cursor: IDBCursorWithValue) {
        const deleteCursor = cursor.delete();
        return new Promise((resolve, reject) => {
            deleteCursor.addEventListener('error', ev => {
                reject(ev);
            });
            deleteCursor.addEventListener('success', ev => {
                resolve(true);
            })
        });
    }

    private async saveReview(review: ReviewData, skip = false) {
        if (navigator.onLine) {
            DBHelper.postData(DBHelper.getReviewUrl(), review);
        } else if (!skip) {
            const database = await this.openDataBase();
            const objectStore = database
                .transaction(DBHelper.REVIEW_SYNC, 'readwrite')
                .objectStore(DBHelper.REVIEW_SYNC);

            return await new Promise((resolve, reject) => {
                const request = objectStore.add(review);
                request
                    .addEventListener('success', () => {
                        resolve();
                    });
                request
                    .addEventListener('error', (err) => {
                        reject(err);
                    })
            });
        }
    }

    public static get INSTANCE(): DBHelper {
        if (this.dbHelper == null) {
            this.dbHelper = new DBHelper();
        }
        return this.dbHelper;
    }

    private static async putReview(reviewData) {
        const db = await this.INSTANCE.openDataBase();
        const objectStore = db
            .transaction(DBHelper.REVIEWS, "readwrite")
            .objectStore(DBHelper.REVIEWS);
        const result = objectStore.put(reviewData);
        return new Promise((resolve, reject) => {
            result.addEventListener("success", () => {
                resolve(true);
            });
            result.addEventListener("error", (event) => {
                reject(event);
            });
        });
    }

    /**
     *
     * @param {string} id
     * @returns {Promise<void>}
     */
    public static async getReviewsForRestaurant(id: string) {
        if (navigator.onLine) {
            const url = this.getReviewUrl(id);
            const response = await fetch(url);
            const data = await response.json();
            if (Array.isArray(data)) {
                for (let d of data) {
                    await this.putReview(d);
                }
            }
            return data;
        } else {
            const db = await this.INSTANCE.openDataBase();
            const objectStore = db
                .transaction(this.REVIEWS, "readonly")
                .objectStore(this.REVIEWS);
            const cursor = objectStore.openCursor();
            return new Promise((resolve, reject) => {
                const data = [];
                cursor.addEventListener("error", reject);
                cursor.addEventListener("success", (event) => {
                    const cursor: IDBCursorWithValue = event.target['result'];

                    if (cursor) {
                        const result = cursor.value;
                        if (result.restaurant_id == id) {
                            data.push(result);
                        }
                        cursor.continue();
                    } else {
                        resolve(data);
                    }
                })
            });
        }
    }


    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        const port = 1337; // Change this to your server port
        return `http://localhost:${port}`;
    }

    static getRestaurantUrl(restaurant: string = null) {
        return `${this.DATABASE_URL}/restaurants/${ restaurant ? restaurant : '' }`;
    }

    static getReviewUrl(restaurant: string = null) {
        return `${this.DATABASE_URL}/reviews/${ restaurant ? `?restaurant_id=${restaurant}` : '' }`;
    }

    private static async putRestaurants(value, objectStore = null) {
        if (!objectStore) {
            const helper = this.INSTANCE;
            const db = await helper.openDataBase();

            objectStore = db
                .transaction(this.RESTAURANTS, "readwrite")
                .objectStore(this.RESTAURANTS);
        }
        return new Promise((resolve, reject) => {
            const result = objectStore.put(value);
            result.addEventListener("error", reject);
            result.addEventListener("success", (event) => resolve(value))
        });
    }

    private static async putRestaurantList(value: any[]) {
        const helper = this.INSTANCE;
        const db = await helper.openDataBase();

        const objectStore = db
            .transaction(this.RESTAURANTS, "readwrite")
            .objectStore(this.RESTAURANTS);
        for (let v of value) {
            await this.putRestaurants(v, objectStore);
        }
    }

    /**
     * Fetch all restaurants.
     */
    private static async fetchRestaurants(id: string = null): Promise<any> {
        if (navigator.onLine) {
            const url = this.getRestaurantUrl(id);
            const response = await fetch(url);
            if (response.status == 200) {
                const value = await response.json();
                if (id) {
                    await this.putRestaurants(value);
                    value.reviews = await this.getReviewsForRestaurant(id);
                } else {
                    await this.putRestaurantList(value);
                }
                return value;
            } else {
                throw new Error(response.statusText);
            }
            // @todo fetch review
        } else {
            const helper = this.INSTANCE;
            const db = await helper.openDataBase();
            const objectStore = db
                .transaction(this.RESTAURANTS)
                .objectStore(this.RESTAURANTS);
            return await new Promise((resolve, reject) => {
                if (id) {
                    const result = objectStore.get(Number(id));
                    result.addEventListener("success", async ev => {
                        const value = ev.target['result'];
                        value.reviews = await this.getReviewsForRestaurant(id);
                        resolve(value);
                    });
                    result.addEventListener("error", (err) => {
                        reject(err);
                    });
                } else {
                    const cursor = objectStore.openCursor();
                    const data = [];
                    cursor.addEventListener("success", (event) => {
                        const cursorValue: IDBCursorWithValue = event.target['result'];
                        if (cursorValue) {
                            const value = cursorValue.value;
                            data.push(value);
                            cursorValue.continue();
                        } else {
                            resolve(data);
                        }
                    });
                    cursor.addEventListener("error", (err) => {
                        reject(err);
                    });
                }
            });
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

    static urlForReview(restaurant) {
        return (`./review.html?id=${restaurant.id}`);
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


window.addEventListener("online", () => {
    DBHelper.INSTANCE.syncReviews();
});
if (navigator.onLine) {
    DBHelper.INSTANCE.syncReviews();
}