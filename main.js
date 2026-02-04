const API_URL = "https://api.escuelajs.co/api/v1/products";

const productsBody = document.getElementById("productsBody");
const loading = document.getElementById("loading");
const errorDiv = document.getElementById("error");
const refreshBtn = document.getElementById("refreshBtn");
const searchInput = document.getElementById("searchInput");
const pageSizeSelect = document.getElementById("pageSize");
const paginationControls = document.getElementById("paginationControls");
const pageInfo = document.getElementById("pageInfo");

// Modal Detail & Edit
const productModalEl = document.getElementById("productModal");
const productModal = new bootstrap.Modal(productModalEl);
const modalTitle = document.getElementById("productModalLabel");
const modalBody = document.getElementById("modalBody");
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");

// Modal Create
const createModalEl = document.getElementById("createModal");
const createModal = new bootstrap.Modal(createModalEl);
const saveCreateBtn = document.getElementById("saveCreateBtn");

let allProducts = [];
let currentPage = 1;
let pageSize = 10;
let sortColumn = null;      // 'title' hoặc 'price'
let sortDirection = 'none'; // 'asc', 'desc', hoặc 'none'
let currentProduct = null;  // sản phẩm đang xem/chỉnh sửa

async function fetchProducts() {
  productsBody.innerHTML = "";
  errorDiv.classList.add("d-none");
  loading.classList.remove("d-none");
  refreshBtn.disabled = true;
  searchInput.disabled = true;
  pageSizeSelect.disabled = true;

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const products = await response.json();
    allProducts = products.sort((a, b) => b.id - a.id); // mới nhất lên đầu

    currentPage = 1;
    sortColumn = null;
    sortDirection = 'none';
    updateSortIcons();

    renderPage();

  } catch (error) {
    console.error("Error fetching products:", error);
    errorDiv.textContent = "Không thể tải dữ liệu. " + error.message;
    errorDiv.classList.remove("d-none");
  } finally {
    loading.classList.add("d-none");
    refreshBtn.disabled = false;
    searchInput.disabled = false;
    pageSizeSelect.disabled = false;
  }
}

function getCurrentData() {
  const query = searchInput.value.trim().toLowerCase();
  let data = allProducts;

  if (query) {
    data = data.filter(product =>
      product.title.toLowerCase().includes(query)
    );
  }

  if (sortColumn && sortDirection !== 'none') {
    data = [...data].sort((a, b) => {
      let valA, valB;

      if (sortColumn === 'title') {
        valA = a.title.toLowerCase();
        valB = b.title.toLowerCase();
      } else if (sortColumn === 'price') {
        valA = a.price;
        valB = b.price;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  } else {
    data = [...data].sort((a, b) => b.id - a.id);
  }

  return data;
}

function renderPage() {
  const data = getCurrentData();
  const totalPages = Math.ceil(data.length / pageSize);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = data.slice(start, end);

  productsBody.innerHTML = "";

  if (pageItems.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="5" class="no-results">Không tìm thấy sản phẩm nào...</td>`;
    productsBody.appendChild(row);
  } else {
    const fragment = document.createDocumentFragment();

    pageItems.forEach(product => {
      const row = document.createElement("tr");
      row.setAttribute("data-bs-toggle", "tooltip");
      row.setAttribute("data-bs-placement", "top");
      row.setAttribute("data-bs-title", product.description || "Không có mô tả");
      row.setAttribute("data-bs-html", "true");

      row.innerHTML = `
        <td class="text-center fw-medium">${product.id}</td>
        <td class="fw-medium">${product.title}</td>
        <td><span class="price">$${product.price.toLocaleString()}</span></td>
        <td><span class="badge bg-info category-badge">${product.category?.name || "Unknown"}</span></td>
        <td>
          ${product.images && product.images.length > 0 
            ? `<img src="${product.images[0].replace(/["[\]]/g, '')}" alt="${product.title}" class="product-image" loading="lazy" onerror="this.src='https://placehold.co/80x80?text=No+Image'">`
            : "<span class='text-muted text-center'>—</span>"}
        </td>
      `;

      fragment.appendChild(row);
    });

    productsBody.appendChild(fragment);
  }

  // Khởi tạo lại tooltip
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  [...tooltipTriggerList].forEach(el => new bootstrap.Tooltip(el, { boundary: document.body }));

  updatePagination(totalPages);
}

function updatePagination(totalPages) {
  pageInfo.textContent = `Trang ${currentPage} / ${totalPages || 1}`;

  paginationControls.innerHTML = "";

  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  prevLi.innerHTML = `<span class="page-link">Previous</span>`;
  if (currentPage > 1) {
    prevLi.addEventListener("click", () => { currentPage--; renderPage(); });
  }
  paginationControls.appendChild(prevLi);

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      const pageLi = document.createElement("li");
      pageLi.className = `page-item ${i === currentPage ? "active" : ""}`;
      pageLi.innerHTML = `<span class="page-link">${i}</span>`;
      pageLi.addEventListener("click", () => { currentPage = i; renderPage(); });
      paginationControls.appendChild(pageLi);
    } else if (
      (i === currentPage - 2 && currentPage > 3) ||
      (i === currentPage + 2 && currentPage < totalPages - 2)
    ) {
      const ellipsis = document.createElement("li");
      ellipsis.className = "page-item disabled";
      ellipsis.innerHTML = `<span class="page-link">...</span>`;
      paginationControls.appendChild(ellipsis);
    }
  }

  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${currentPage === totalPages || totalPages === 0 ? "disabled" : ""}`;
  nextLi.innerHTML = `<span class="page-link">Next</span>`;
  if (currentPage < totalPages) {
    nextLi.addEventListener("click", () => { currentPage++; renderPage(); });
  }
  paginationControls.appendChild(nextLi);
}

function updateSortIcons() {
  document.querySelectorAll('.sortable').forEach(th => {
    const col = th.dataset.sort;
    th.dataset.direction = (col === sortColumn) ? sortDirection : 'none';
  });
}

// Sự kiện sort
document.querySelectorAll('.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const column = th.dataset.sort;

    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        sortDirection = 'desc';
      } else if (sortDirection === 'desc') {
        sortDirection = 'none';
        sortColumn = null;
      } else {
        sortDirection = 'asc';
      }
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }

    currentPage = 1;
    updateSortIcons();
    renderPage();
  });
});

// Export CSV
function exportToCSV() {
  const data = getCurrentData();

  if (data.length === 0) {
    alert("Không có dữ liệu để export!");
    return;
  }

  const headers = ["ID", "Title", "Price", "Category", "Description", "Image URL"];

  const rows = data.map(product => {
    const imageUrl = product.images?.length > 0 ? product.images[0].replace(/["[\]]/g, '') : "";
    return [
      product.id,
      `"${(product.title || "").replace(/"/g, '""')}"`,
      product.price,
      `"${(product.category?.name || "Unknown").replace(/"/g, '""')}"`,
      `"${(product.description || "").replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${imageUrl}"`
    ];
  });

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `products_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ---------------------- Modal Detail & Edit ----------------------

function showProductDetail(product) {
  currentProduct = product;
  modalTitle.textContent = product.title || "Product Detail";

  const imagesHtml = product.images?.length > 0
    ? `
      <div id="imageCarousel" class="carousel slide mb-3" data-bs-ride="carousel">
        <div class="carousel-inner">
          ${product.images.map((img, idx) => {
            const src = img.replace(/["[\]]/g, '');
            return `
              <div class="carousel-item ${idx === 0 ? 'active' : ''}">
                <img src="${src}" class="d-block w-100" alt="${product.title}" style="max-height:300px; object-fit:contain;" onerror="this.src='https://placehold.co/600x400?text=No+Image'">
              </div>
            `;
          }).join('')}
        </div>
        ${product.images.length > 1 ? `
          <button class="carousel-control-prev" type="button" data-bs-target="#imageCarousel" data-bs-slide="prev">
            <span class="carousel-control-prev-icon"></span>
          </button>
          <button class="carousel-control-next" type="button" data-bs-target="#imageCarousel" data-bs-slide="next">
            <span class="carousel-control-next-icon"></span>
          </button>
        ` : ''}
      </div>
    `
    : '<img src="https://placehold.co/600x400?text=No+Image" class="img-fluid mb-3" alt="No image">';

  modalBody.innerHTML = `
    <div class="row">
      <div class="col-md-5">
        ${imagesHtml}
      </div>
      <div class="col-md-7">
        <h5>Description</h5>
        <p>${product.description || "No description available."}</p>
        
        <h5>Price</h5>
        <p class="fs-4 fw-bold text-primary">$${product.price.toLocaleString()}</p>
        
        <h5>Category</h5>
        <p>${product.category?.name || "Unknown"}</p>
        
        <h5>Details</h5>
        <p>ID: ${product.id}<br>Created: ${new Date(product.creationAt).toLocaleString()}</p>
      </div>
    </div>
  `;

  editBtn.classList.remove("d-none");
  saveBtn.classList.add("d-none");
  cancelBtn.classList.add("d-none");

  productModal.show();
}

function enterEditMode() {
  if (!currentProduct) return;

  modalBody.innerHTML = `
    <form id="editProductForm">
      <div class="mb-3">
        <label for="editTitle" class="form-label">Title</label>
        <input type="text" class="form-control" id="editTitle" value="${currentProduct.title || ''}">
      </div>
      <div class="mb-3">
        <label for="editPrice" class="form-label">Price ($)</label>
        <input type="number" class="form-control" id="editPrice" value="${currentProduct.price || 0}" min="0" step="0.01">
      </div>
      <div class="mb-3">
        <label for="editDescription" class="form-label">Description</label>
        <textarea class="form-control" id="editDescription" rows="4">${currentProduct.description || ''}</textarea>
      </div>
      <div class="mb-3">
        <label for="editImages" class="form-label">Image URLs (comma separated)</label>
        <input type="text" class="form-control" id="editImages" value="${currentProduct.images ? currentProduct.images.map(i => i.replace(/["[\]]/g, '')).join(', ') : ''}">
        <small class="text-muted">Ví dụ: https://example.com/img1.jpg, https://example.com/img2.jpg</small>
      </div>
    </form>
  `;

  editBtn.classList.add("d-none");
  saveBtn.classList.remove("d-none");
  cancelBtn.classList.remove("d-none");
}

async function saveChanges() {
  if (!currentProduct) return;

  const updated = {
    title: document.getElementById("editTitle").value.trim(),
    price: parseFloat(document.getElementById("editPrice").value),
    description: document.getElementById("editDescription").value.trim(),
    images: document.getElementById("editImages").value
      .split(',')
      .map(u => u.trim())
      .filter(u => u)
  };

  if (!updated.title || isNaN(updated.price) || updated.price <= 0) {
    alert("Vui lòng nhập Title và Price hợp lệ!");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${currentProduct.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });

    if (!response.ok) throw new Error(`Update failed: ${response.status}`);

    alert("Cập nhật thành công!");
    productModal.hide();
    fetchProducts();

  } catch (err) {
    alert("Lỗi khi cập nhật: " + err.message);
  }
}

// ---------------------- Modal Create New Product ----------------------

saveCreateBtn.addEventListener("click", async () => {
  const title = document.getElementById("createTitle").value.trim();
  const priceStr = document.getElementById("createPrice").value.trim();
  const description = document.getElementById("createDescription").value.trim();
  const imagesStr = document.getElementById("createImages").value.trim();
  const categoryIdStr = document.getElementById("createCategoryId").value.trim();

  const price = parseFloat(priceStr);
  const categoryId = parseInt(categoryIdStr);

  if (!title || isNaN(price) || price <= 0 || isNaN(categoryId) || categoryId < 1) {
    alert("Vui lòng điền đầy đủ và đúng định dạng các trường bắt buộc: Title, Price, Category ID!");
    return;
  }

  const images = imagesStr
    ? imagesStr.split(',').map(url => url.trim()).filter(url => url)
    : [];

  const newProduct = {
    title,
    price,
    description: description || "No description provided",
    categoryId,
    images: images.length > 0 ? images : undefined
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    });

    if (!response.ok) {
      throw new Error(`Tạo thất bại: ${response.status} - ${response.statusText}`);
    }

    const created = await response.json();
    alert(`Tạo sản phẩm thành công!\nID mới: ${created.id}\nTiêu đề: ${created.title}`);

    createModal.hide();
    fetchProducts(); // refresh để hiển thị sản phẩm mới

  } catch (error) {
    console.error("Lỗi khi tạo sản phẩm:", error);
    alert("Không thể tạo sản phẩm: " + error.message);
  }
});

// ---------------------- Event Listeners ----------------------

// Click row mở modal detail
productsBody.addEventListener("click", e => {
  const row = e.target.closest("tr");
  if (!row) return;

  const id = parseInt(row.cells[0]?.textContent);
  if (isNaN(id)) return;

  const product = allProducts.find(p => p.id === id);
  if (product) showProductDetail(product);
});

// Modal Detail/Edit buttons
editBtn.addEventListener("click", enterEditMode);
saveBtn.addEventListener("click", saveChanges);
cancelBtn.addEventListener("click", () => {
  if (currentProduct) showProductDetail(currentProduct);
});

// Các sự kiện khác
refreshBtn.addEventListener("click", fetchProducts);
searchInput.addEventListener("input", () => { currentPage = 1; renderPage(); });
pageSizeSelect.addEventListener("change", () => {
  pageSize = parseInt(pageSizeSelect.value);
  currentPage = 1;
  renderPage();
});
document.getElementById("exportBtn").addEventListener("click", exportToCSV);

fetchProducts();

document.getElementById("createBtn").addEventListener("click", () => {
  // Reset form để sạch sẽ mỗi lần mở
  const form = document.getElementById("createProductForm");
  if (form) form.reset();
  
  // Đặt giá trị mặc định cho Category ID
  document.getElementById("createCategoryId").value = "1";
  
  // Mở modal
  createModal.show();
});

// Khởi động ứng dụng

