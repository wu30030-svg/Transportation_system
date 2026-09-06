function openVehicleModal() {
    document.getElementById("vehicle-modal-overlay").classList.add("active");
    toggleTruckOptions();
}

function closeVehicleModal() {
    document.getElementById("vehicle-modal-overlay").classList.remove("active");
}


function toggleTruckOptions() {
    const vehicleType = document.getElementById("vehicle-type").value;
    document.getElementById("truck-options").style.display = vehicleType === "truck" ? "block" : "none";
}
