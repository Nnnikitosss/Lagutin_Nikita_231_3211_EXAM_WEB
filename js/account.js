document.addEventListener('DOMContentLoaded', function () {
    fetchOrders();
});

let productDictionary = {};
let productPrice = {};

function getProductArray() {
    fetch('https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods?api_key=ea191b65-ab69-4c0e-824f-4f3156c177b1')
        .then(response => response.json())
        .then(data => {
            data.forEach(product => {
                productDictionary[String(product.id)] = product.name;
                productPrice[String(product.id)] = product.discount_price !== null ? product.discount_price : product.actual_price;
            });
        })
        .catch(error => {
            console.error('Ошибка при загрузке списка товаров:', error);
        });
}

getProductArray();

function fetchOrders() {
    fetch('https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders?api_key=ea191b65-ab69-4c0e-824f-4f3156c177b1', {
        method: 'GET',
    })
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector('table tbody');
            tbody.innerHTML = '';

            let displayedId = 1;

            function calculateOrderPrice(productIds) {
                return productIds.reduce((total, id) => total + (productPrice[String(id)] || 0), 0);
            }

            function getProductNameById(id) {
                return productDictionary[String(id)];
            }

            data.forEach(order => {
                const row = document.createElement('tr');

                row.dataset.id = order.id;
                row.dataset.fullName = order.full_name;
                row.dataset.date = order.created_at;
                row.dataset.email = order.email;
                row.dataset.phone = order.phone;
                row.dataset.address = order.delivery_address;
                row.dataset.deliveryDate = order.delivery_date;
                row.dataset.deliveryInterval = order.delivery_interval;
                row.dataset.comment = order.comment || '';

                const productIds = order.good_ids;
                const orderItems = productIds.map(id => getProductNameById(id)).filter(name => name);
                const orderPrice = calculateOrderPrice(productIds);

                const orderItemsString = orderItems.join(', ');

                row.dataset.cost = `${orderPrice} руб.`;
                row.dataset.order = orderItemsString;

                let datetime = `${order.created_at.slice(0, 10)} ${order.created_at.slice(11, -3)}`;
                let deliveryDateTime = `${order.delivery_date} ${order.delivery_interval}`;

                row.innerHTML = `
                    <td>${displayedId++}</td>
                    <td>${datetime}</td>
                    <td>${orderItemsString}</td>
                    <td>${orderPrice} руб.</td>
                    <td>${deliveryDateTime}</td>
                    <td>
                        <span class="action-btn" onclick="showDetails(this)" title="Подробнее"><img src="images/eye.svg" alt="Eye"></span>
                        <span class="action-btn" onclick="editOrder(this)" title="Редактировать"><img src="images/pencil.svg" alt="Pencil"></span>
                        <span class="action-btn" onclick="deleteOrder(this)" title="Удалить"><img src="images/trash3.svg" alt="Trash"></span>
                    </td>
                `;

                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Ошибка при загрузке заказов:', error);
            alert('Не удалось загрузить заказы.');
        });
}

function openModal(type) {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById(type + '-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('overlay').style.display = 'none';
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.style.display = 'none');
}

function showDetails(button) {
    const row = button.closest('tr');

    document.getElementById('details-date').textContent = row.cells[1].textContent;
    document.getElementById('details-full-name').textContent = row.dataset.fullName;
    document.getElementById('details-address').textContent = row.dataset.address;
    document.getElementById('details-type').textContent = row.dataset.deliveryInterval;
    document.getElementById('details-time').textContent = row.dataset.deliveryDate;
    document.getElementById('details-phone').textContent = row.dataset.phone;
    document.getElementById('details-email').textContent = row.dataset.email;
    document.getElementById('details-comment').textContent = row.dataset.comment;
    document.getElementById('details-order').textContent = row.dataset.order;
    document.getElementById('details-cost').textContent = row.dataset.cost;

    openModal('view');
}

function editOrder(button) {
    const row = button.closest('tr');
    openModal('edit');

    document.getElementById('edit-order-id').value = row.dataset.id;
    document.getElementById('edit-date').value = row.cells[1].textContent;
    document.getElementById('edit-full-name').value = row.dataset.fullName;
    document.getElementById('edit-address').value = row.dataset.address;
    document.getElementById('edit-time').value = row.dataset.deliveryInterval;
    document.getElementById('edit-phone').value = row.dataset.phone;
    document.getElementById('edit-email').value = row.dataset.email;
    document.getElementById('edit-comment').value = row.dataset.comment;
    document.getElementById('edit-order').value = row.dataset.order;
    document.getElementById('edit-cost').value = row.dataset.cost;
}

function saveOrder() {
    const orderId = document.getElementById('edit-order-id').value;
    if (!orderId) {
        console.error('ID заказа не найден.');
        return;
    }
    const fullName = document.getElementById('edit-full-name').value;
    const address = document.getElementById('edit-address').value;
    const deliveryInterval = document.getElementById('edit-time').value;
    const phone = document.getElementById('edit-phone').value;
    const email = document.getElementById('edit-email').value;
    const comment = document.getElementById('edit-comment').value;

    const orderData = {
        full_name: fullName,
        delivery_address: address,
        delivery_interval: deliveryInterval,
        phone: phone,
        email: email,
        comment: comment
    };

    fetch(`https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders/${orderId}?api_key=ea191b65-ab69-4c0e-824f-4f3156c177b1`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
        .then(response => {
            if (!response.ok) {
                console.error('Ошибка HTTP:', response.status, response.statusText);
                console.error('URL:', response.url);
                return response.json().then(data => {
                    console.error('Ответ сервера:', data);
                    throw new Error('Не удалось обновить заказ');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert('Изменения сохранены!');
                closeModal();
                location.reload();
            }
        })
        .catch(error => {
            console.error('Ошибка при обновлении заказа:', error);
            alert('Произошла ошибка при сохранении изменений.');
        });
}

function deleteOrder(button) {
    const row = button.closest('tr');
    openModal('delete');
    orderIdToDelete = row.dataset.id;
}

function confirmDelete() {
    if (!orderIdToDelete) {
        console.error('ID заказа не найден.');
        return;
    }

    fetch(`https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders/${orderIdToDelete}?api_key=ea191b65-ab69-4c0e-824f-4f3156c177b1`, {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) {
                console.error('Ошибка HTTP:', response.status, response.statusText);
                console.error('URL:', response.url);
                return response.json().then(data => {
                    console.error('Ответ сервера:', data);
                    throw new Error('Не удалось удалить заказ');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert('Заказ удалён!');
                closeModal();
                location.reload();
            }
        })
        .catch(error => {
            console.error('Ошибка при удалении заказа:', error);
            alert('Ошибка при удалении заказа: ' + error);
        });
}
