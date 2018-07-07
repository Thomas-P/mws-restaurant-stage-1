interface ReviewData {
    restaurant_id: number,
    name: string;
    date: Date;
    rating: number;
    comments: string;
}

function localScope() {
    let restaurantLocal;
    let restaurantMap;
    let reviewData: ReviewData = {
        restaurant_id: 0,
        name: "",
        date: new Date(),
        rating: 1,
        comments: ""
    };
    let onSubmit = false;

    /**
     * Initialize map as soon as the page is loaded.
     */
    document.addEventListener('DOMContentLoaded', (event) => {
        initReview();
    });

    const checkValid = ():boolean => {
        const button = <HTMLButtonElement>document.querySelector('button[name=addReview]');
        return !(button.disabled = Object
            .keys(reviewData)
            .map((key) => reviewData[key])
            .some((value) => !value) || onSubmit);

    };

    /**
     * Initialize review
     */
    const initReview = async () => {
        const restaurant = await fetchRestaurantFromURL();
        if (restaurant) {
            fillBreadcrumb();
        }
        initReviewData();
        checkValid();
        const button = <HTMLButtonElement>document.querySelector('button[name=addReview]');
        button.addEventListener("click", async (event) => {
            if (!checkValid()) {
                return;
            }
            await DBHelper.createReview(reviewData);
            onSubmit = false;
            document.location.href = DBHelper.urlForRestaurant({
                id: reviewData.restaurant_id
            });
        })
    };

    const initReviewData = () => {
        const name = <HTMLInputElement>document.querySelector('input[name=name]');
        name.addEventListener('keypress', (event) => {
            reviewData.name = String.prototype.trim.call(name.value);
            checkValid();
        });
        reviewData.name = name.value;
        const review = <HTMLTextAreaElement>document.querySelector('textarea[name=review]');
        review.addEventListener('keypress', (event) => {
            reviewData.comments = String.prototype.trim.call(review.value);
            checkValid();
        });
        reviewData.comments = review.value;
        reviewData.restaurant_id = Number(getParameterByName('id'));
        initReviewRanker();
    };

    const initReviewRanker = () => {
        const radioElements: HTMLInputElement[] = Array.prototype.slice.call(document.querySelectorAll('#review-ranking input[type=radio]'));
        const updateRadio = (event) => {
            let got = false;
            radioElements.forEach((r, index) => {
                if (r.checked) {
                    reviewData.rating = Number(r.value);
                }
            });
            radioElements.forEach((r, index) => {
                if (reviewData.rating > index) {
                    r.parentElement.classList.add('chosen');
                } else {
                    r.parentElement.classList.remove('chosen');
                }
                if (document.activeElement == r) {
                    r.parentElement.classList.add('focus');
                } else {
                    r.parentElement.classList.remove('focus');
                }
                checkValid();
            });
        };
        updateRadio(null);
        radioElements.forEach((radio) => {
            radio.addEventListener('change',updateRadio);
            radio.addEventListener('blur',updateRadio);
            radio.addEventListener('focus',updateRadio);
        });
    };

    /**
     * Get current restaurantLocal from page URL.
     */
    const fetchRestaurantFromURL = async () => {
        if (restaurantLocal) {
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
        if (restaurant.photograph) {
            image.className = 'restaurantLocal-img';
            image.src = '/img/placeholder.png';
            image.dataset.src = DBHelper.imageUrlForRestaurant(restaurant);
            image.alt = 'Photo of ' + restaurant.name;
            image.dataset.srcset = DBHelper.imageUrlForRestaurantLow(restaurant) + ' 400w';
            image.style.visibility = 'visible';
            image.classList.add('lazuy')
        } else {
            image.style.visibility = 'hidden';
        }

        const cuisine = document.getElementById('restaurant-cuisine');
        cuisine.innerHTML = restaurant.cuisine_type;

        // fill operating hours
        if (restaurant.operating_hours) {
            fillRestaurantHoursHTML();
        }
        DBHelper.lazyLoadInit();
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
        const at = document.createElement('a');
        at.textContent =restaurant.name;
        at.href = DBHelper.urlForRestaurant(restaurant);
        li.appendChild(at);
        breadcrumb.appendChild(li);

        const li2 = document.createElement('li');
        li2.innerText = 'Write a review';
        li2.setAttribute('aria-current', 'page');
        breadcrumb.appendChild(li2);
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
}
localScope();