document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'ea191b65-ab69-4c0e-824f-4f3156c177b1';
    const apiUrl = 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods';
    const productsContainer = document.getElementById('products');
    const loadMoreButton = document.getElementById('load-more');
    const searchButton = document.querySelector('.search-button');
    const searchInput = document.querySelector('.search');
    const filterForm = document.getElementById('filter-form');
    const resetFiltersButton = document.getElementById('reset-filters');
    const sortOrderSelect = document.getElementById('sort-order');
    const notificationBar = document.getElementById('notification-bar');
    let products = [];
    let currentIndex = 0;
    const perPage = 6;
    const selectedProductIds = JSON.parse(localStorage.getItem('selectedProductIds')) || [];

    console.log('DOMContentLoaded: Инициализация переменных и элементов DOM');

    if (!productsContainer || !loadMoreButton || !searchButton || !searchInput || !filterForm || !resetFiltersButton || !sortOrderSelect || !notificationBar) {
        console.error('Не найдены необходимые элементы на странице.');
        return;
    }

    function displayProducts() {
        console.log('displayProducts: Отображение товаров', products);
        if (products.length === 0) {
            productsContainer.innerHTML = '<p>Товары не найдены.</p>';
            loadMoreButton.style.display = 'none';
            return;
        }

        const endIndex = Math.min(currentIndex + perPage, products.length);
        for (let i = currentIndex; i < endIndex; i++) {
            const product = products[i];
            const productElement = document.createElement('div');
            productElement.classList.add('product');
            const ratingStars = '<span style="color: gold;">' + '★'.repeat(Math.round(product.rating)) + '☆'.repeat(5 - Math.round(product.rating)) + '</span>';
            let priceInfo;
            if (product.discount_price) {
                const discount = Math.round((1 - product.discount_price / product.actual_price) * 100);
                priceInfo = `${product.discount_price} руб. <span style="color: red; text-decoration: line-through;">${product.actual_price} руб.</span> <span style="color: red;">-${discount}%</span>`;
            } else {
                priceInfo = `${product.actual_price} руб.`;
            }
            productElement.innerHTML = `
                <img src="${product.image_url}" alt="${product.name}" style="width: 100%; height: auto; object-fit: contain;">
                <h3>${product.name}</h3>
                <p>${product.rating} ${ratingStars}</p>
                <p>${priceInfo}</p>
                <button data-id="${product.id}" class="add-to-cart">Добавить в корзину</button>
            `;
            productsContainer.appendChild(productElement);
        }
        currentIndex = endIndex;
        if (currentIndex >= products.length) {
            loadMoreButton.style.display = 'none';
        } else {
            loadMoreButton.style.display = 'block';
        }
        restoreSelectedProducts();
    }

    function saveSelectedProductIds() {
        console.log('saveSelectedProductIds: Сохранение выбранных товаров', selectedProductIds);
        localStorage.setItem('selectedProductIds', JSON.stringify(selectedProductIds));
    }

    function restoreSelectedProducts() {
        console.log('restoreSelectedProducts: Восстановление выбранных товаров', selectedProductIds);
        selectedProductIds.forEach(id => {
            const productElement = document.querySelector(`button[data-id="${id}"]`);
            if (productElement) {
                productElement.classList.add('selected');
                productElement.textContent = 'В корзине';
            }
        });
    }

    function showNotification(message, type) {
        notificationBar.textContent = message;
        notificationBar.className = type;
        notificationBar.style.display = 'block';
        setTimeout(() => {
            notificationBar.style.display = 'none';
        }, 3000);
    }

    async function loadProducts(query = '', filters = {}, sortOrder = '') {
        console.log('loadProducts: Загрузка товаров', { query, filters, sortOrder });
        try {
            const url = new URL(apiUrl);
            url.searchParams.append('api_key', apiKey);
            if (query) {
                url.searchParams.append('query', query);
            }
            Object.keys(filters).forEach(key => {
                if (Array.isArray(filters[key])) {
                    filters[key].forEach(value => url.searchParams.append(key, value));
                } else {
                    url.searchParams.append(key, filters[key]);
                }
            });
            if (sortOrder) {
                url.searchParams.append('sort', sortOrder);
            }
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            const data = await response.json();
            console.log('loadProducts: Полученные данные', data);
            products = data || [];
            if (filters.discount) {
                products = products.filter(product => product.discount_price !== null);
            }
            if (filters.price_min || filters.price_max) {
                const priceMin = parseFloat(filters.price_min) || 0;
                const priceMax = parseFloat(filters.price_max) || Infinity;
                products = products.filter(product => {
                    const price = product.discount_price !== null ? product.discount_price : product.actual_price;
                    return price >= priceMin && price <= priceMax;
                });
            }
            if (filters.main_category) {
                products = products.filter(product => filters.main_category.includes(product.main_category));
            }
            if (sortOrder) {
                switch (sortOrder) {
                    case 'rating_desc':
                        products.sort((a, b) => b.rating - a.rating);
                        break;
                    case 'rating_asc':
                        products.sort((a, b) => a.rating - b.rating);
                        break;
                    case 'price_desc':
                        products.sort((a, b) => {
                            const priceA = a.discount_price !== null ? a.discount_price : a.actual_price;
                            const priceB = b.discount_price !== null ? b.discount_price : b.actual_price;
                            return priceB - priceA;
                        });
                        break;
                    case 'price_asc':
                        products.sort((a, b) => {
                            const priceA = a.discount_price !== null ? a.discount_price : a.actual_price;
                            const priceB = b.discount_price !== null ? b.discount_price : b.actual_price;
                            return priceA - priceB;
                        });
                        break;
                }
            }
            currentIndex = 0;
            productsContainer.innerHTML = '';
            displayProducts();
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            if (error.message.includes('Failed to fetch')) {
                productsContainer.innerHTML = `<p>Ошибка загрузки товаров: Сервер недоступен или доменное имя введено неправильно.</p>`;
            } else {
                productsContainer.innerHTML = `<p>Ошибка загрузки товаров: ${error.message}</p>`;
            }
        }
    }

    productsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('add-to-cart')) {
            const productId = event.target.dataset.id;
            console.log('add-to-cart: Нажата кнопка добавления в корзину', productId);
            if (selectedProductIds.includes(productId)) {
                selectedProductIds.splice(selectedProductIds.indexOf(productId), 1);
                event.target.classList.remove('selected');
                event.target.textContent = 'Добавить в корзину';
                showNotification('Товар убран из корзины', 'notification-red');
            } else {
                selectedProductIds.push(productId);
                event.target.classList.add('selected');
                event.target.textContent = 'В корзине';
                showNotification('Товар добавлен в корзину', 'notification-green');
            }
            saveSelectedProductIds();
        }
    });

    loadMoreButton.addEventListener('click', () => {
        console.log('loadMoreButton: Нажата кнопка "Загрузить еще"');
        displayProducts();
    });

    searchButton.addEventListener('click', () => {
        const query = searchInput.value;
        console.log('searchButton: Нажата кнопка поиска', query);
        loadProducts(query);
    });

    filterForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(filterForm);
        const filters = {};
        formData.forEach((value, key) => {
            if (!filters[key]) {
                filters[key] = [];
            }
            filters[key].push(value);
        });
        console.log('filterForm: Отправлена форма фильтрации', filters);
        loadProducts(searchInput.value, filters, sortOrderSelect.value);
    });

    resetFiltersButton.addEventListener('click', () => {
        console.log('resetFiltersButton: Нажата кнопка сброса фильтров');
        filterForm.reset();
        loadProducts(searchInput.value);
    });

    sortOrderSelect.addEventListener('change', () => {
        console.log('sortOrderSelect: Изменен порядок сортировки', sortOrderSelect.value);
        loadProducts(searchInput.value, {}, sortOrderSelect.value);
    });

    console.log('DOMContentLoaded: Загрузка товаров');
    loadProducts();
});