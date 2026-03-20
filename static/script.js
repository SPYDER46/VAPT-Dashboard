let deleteId = null;

// Open Add Modal
function openModal() {
    document.getElementById("modal").style.display = "block";
}

// Close Add Modal
function closeModal() {
    document.getElementById("modal").style.display = "none";
}

// Open Delete Modal
function confirmDelete(id) {
    deleteId = id;
    document.getElementById("deleteModal").style.display = "block";
}

// Close Delete Modal
function closeDeleteModal() {
    document.getElementById("deleteModal").style.display = "none";
}

// Delete Page
function deletePage() {
    window.location.href = "/delete/" + deleteId;
}

/* Optional: Close modal when clicking outside */
window.onclick = function(event) {
    const modal = document.getElementById("modal");
    const deleteModal = document.getElementById("deleteModal");

    if (event.target === modal) {
        modal.style.display = "none";
    }

    if (event.target === deleteModal) {
        deleteModal.style.display = "none";
    }
};