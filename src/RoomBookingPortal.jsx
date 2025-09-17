import React, { useState, useEffect } from "react";
import { CheckCircle, Users, Crown, X, Check } from "lucide-react";

const RoomBookingPortal = () => {
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    gender: "",
    age: "",
    roomType: "",
    transport: "",
    facilitator: "",
    message: "",
    // peopleCount: 1,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showUploadSuccessPopup, setShowUploadSuccessPopup] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paymentProof, setPaymentProof] = useState(null);

  //Slider images
  const sliderImages = [
    "https://www.rupanugabhajanashram.com/wp-content/uploads/2023/12/12-sri-sri-radha-Govinda-dev-ji-mandira-featured.jpg",
  ];

  // Auto-change slides every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [sliderImages.length]);

  // QR codes for different room types (placeholder images)
  const qrCodes = {
    semi: "./images/qrCode.jpg", // replace with real QR
    super: "./images/qrCode.jpg",
  };

  const roomOptions = [
    {
      id: "super_with_transport",
      name: "Super Deluxe AC Room (2 bed) with Transportation",
      price: "₹6500",
      basePrice: 6500,
      icon: <Crown className="w-5 h-5" />,
      description: "Includes Accommodation, Transportation & Prasadam",
      transportation: "Yes"
    },
    {
      id: "super_without_transport",
      name: "Super Deluxe AC Room (2 bed) without Transportation",
      price: "₹5000",
      basePrice: 5000,
      icon: <Crown className="w-5 h-5" />,
      description: "Includes only Accommodation & Prasadam",
      transportation: "No"
    },
    {
      id: "semi_with_transport",
      name: "Semi Deluxe AC Room (2+1 bed) with Transportation",
      price: "₹5200",
      basePrice: 5200,
      icon: <Users className="w-5 h-5" />,
      description: "Includes Accommodation, Transportation & Prasadam",
      transportation: "Yes"
    },
    {
      id: "semi_without_transport",
      name: "Semi Deluxe AC Room (2+1 bed) without Transportation",
      price: "₹3700",
      basePrice: 3700,
      icon: <Users className="w-5 h-5" />,
      description: "Includes only Accommodation & Prasadam",
      transportation: "No"
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Special handling for peopleCount to restrict to 1-3
    if (name === "peopleCount") {
      const numValue = Number(value);
      // Only update if the value is between 1-3 or empty (for user editing)
      if (value === "" || (numValue >= 1 && numValue <= 3)) {
        setFormData((prev) => ({
          ...prev,
          [name]: value === "" ? "" : numValue,
        }));
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoomSelect = (roomId) => {
    setFormData((prev) => ({
      ...prev,
      roomType: roomId,
    }));
  };

  // Helper to calculate total price
  const calculateTotalPrice = () => {
    const selectedRoom = roomOptions.find(
      (room) => room.id === formData.roomType
    );
    if (!selectedRoom) return 0;

    let roomPrice = selectedRoom.basePrice;

    // Adjust room price based on peopleCount
    // if (formData.peopleCount === 1) {
    //   roomPrice = roomPrice;
    // } else if (formData.peopleCount === 2) {
    //   roomPrice = roomPrice * 2;
    // } else if (formData.peopleCount === 3) {
    //   roomPrice = roomPrice * 3;
    // }

    // Add transport charges
    if (formData.transport === "delhi") {
      roomPrice += 1500;
    }

    return Math.round(roomPrice);
  };

  const handleFileUpload = async (file, e) => {
    if (!file || !validateForm()) {
      alert("Please fill all required fields!");
      setIsSubmitting(false);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result.split(",")[1]; // no need to do extra reading

      const fileName =
        formData.name.replace(/\s+/g, "_") +
        "_" +
        formData.contact +
        "_" +
        file.name;

      const data = new FormData();
      data.append("name", fileName);
      data.append("type", file.type);
      data.append("data", base64Data);

      try {
        const response = await fetch(
          "https://script.google.com/macros/s/AKfycbyV3z9wqNu8x1OpYgcKkWgS3XmCb_tf69t6o1vOxwHjajvm3lykOu8sZhrWtZ8YGyGd/exec",
          {
            method: "POST",
            body: data,
          }
        );
        const result = await response.json();
        console.log("Uploaded File URL:", result.url);
        // alert("Image uploaded!");

        await handleSubmit(e, result.url);

        setIsSubmitting(false);
        resetForm();

        // Save URL in state for your records
        setFormData((prev) => ({ ...prev, paymentProofUrl: result.url }));
      } catch (err) {
        console.error("Upload error:", err);
        alert("Upload failed. Check console.");
      }
    };

    reader.readAsDataURL(file);
  };

  // Send data to Google Sheets
  const submitToGoogleSheets = async (data) => {
    const GOOGLE_SCRIPT_URL =
      "https://script.google.com/macros/s/AKfycbwODXNdwrIYs3pvyhtogaMDIRF-nHw9s_JYwE4St8l5e75qXK9tpX-da83kqbyX5F4/exec";

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("Data submitted to Google Sheets:", data);
      return true;
    } catch (error) {
      console.error("Error submitting to Google Sheets:", error);
      throw error;
    }
  };

  const validateForm = () => {
    if (
      !formData.name ||
      !formData.contact ||
      !formData.gender ||
      !formData.age ||
      !formData.roomType ||
      !formData.facilitator
    ) {
      alert("Please fill in all fields");
      return false;
    }

    return true;
  }

  const handleSubmit = async (e, fileUrl) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      // Calculate price before sending
      const totalPrice = calculateTotalPrice();
      const selectedRoom = roomOptions.find(
        (room) => room.id === formData.roomType
      );

      // Prepare comprehensive submission data
      const submissionData = {
        name: formData.name,
        contact: formData.contact,
        gender: formData.gender,
        age: formData.age,
        roomType: formData.roomType,
        roomName: selectedRoom?.name || "",
        transport: selectedRoom.transportation,
        facilitator: formData.facilitator,
        screenshotUrl: fileUrl || formData.paymentProofUrl || "",
        // peopleCount: formData.peopleCount,
        message: formData.message || "",
        totalPrice: totalPrice,
        basePrice: (selectedRoom?.basePrice || 0).toString(),
        transportCost: (formData.transport === "delhi" ? 1500 : 0).toString(),
      };

      console.log("Submitting data:", submissionData);

      // Send to Google Sheets
      await submitToGoogleSheets(submissionData);

      // Show success popup
      setShowSuccessPopup(true);

      // Auto-hide popup and show payment screen after 3 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
        setIsSubmitted(true);
      }, 3000);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePopupClose = () => {
    setShowSuccessPopup(false);
    setIsSubmitted(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      contact: "",
      gender: "",
      age: "",
      roomType: "",
      transport: "",
      facilitator: "",
      message: "",
      // peopleCount: 1,
    });
    setPaymentProof(null);
    setIsSubmitted(false);
    // setShowSuccessPopup(false);
    window.scrollTo(0, 0);
  };

  // Success Popup Component
  const SuccessPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl transform animate-bounce">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>

          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Booking Confirmed!
          </h3>

          <p className="text-gray-600 mb-2">
            Hi{" "}
            <span className="font-semibold text-orange-600">
              {formData.name}
            </span>
            !
          </p>

          <p className="text-gray-600 mb-6">
            Your booking information has been successfully saved.
          </p>

          {/* <div className="flex justify-center space-x-4">
            <button
              onClick={handlePopupClose}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
            ></button>
          </div> */}
        </div>
      </div>
    </div>
  );

  // Payment Screen
  if (isSubmitted) {
    // const selectedRoom = roomOptions.find(
    //   (room) => room.id === formData.roomType
    // );
    // const totalPrice = calculateTotalPrice();
  }

  // Calculate current total price for display
  const currentTotalPrice = calculateTotalPrice();

  // Main Booking Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">
      {/* Success Popup */}
      {showSuccessPopup && <SuccessPopup />}
      {/* Image Slider Header */}
      <div className="relative h-96 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={sliderImages[currentSlide]}
            alt="Hotel"
            className="w-full h-full object-cover transition-all duration-1000 transform scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-300/70 via-red-300/80 to-pink-600/80"></div>
        </div>

        {/* Floating Header */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center px-4 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-2xl leading-tight">
              Jaipur Kartik Yatra
            </h1>
            <div className="bg-white/20 backdrop-blur-md rounded-full px-8 py-3 inline-block border border-white/30">
              <span className="text-white text-xl font-semibold">
                Room Booking Portal
              </span>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {sliderImages.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-orange-100">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
                Reserve Your Room
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto rounded-full"></div>
            </div>

            {/* Name */}
            <div className="mb-6">
              <label className="block mb-3 text-gray-700 font-semibold">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-5 py-4 border-2 border-orange-200 rounded-2xl focus:border-orange-500 focus:outline-none transition-all duration-300"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Contact */}
            <div className="mb-6">
              <label className="block mb-3 text-gray-700 font-semibold">
                Contact Number
              </label>
              <input
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                className="w-full px-5 py-4 border-2 border-orange-200 rounded-2xl focus:border-orange-500 focus:outline-none transition-all duration-300"
                placeholder="Enter your contact number"
                required
              />
            </div>

            {/* Age */}
            <div className="mb-6">
              <label className="block mb-3 text-gray-700 font-semibold">
                Age
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="w-full px-5 py-4 border-2 border-orange-200 rounded-2xl focus:border-orange-500 focus:outline-none transition-all duration-300"
                placeholder="Enter your age"
                required
              />
            </div>

            {/* Gender */}
            <div className="mb-6">
              <label className="block mb-3 text-gray-700 font-semibold">
                Gender
              </label>
              <div className="flex gap-6">
                {["Male", "Female"].map((g) => (
                  <label key={g} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={g.toLowerCase()}
                      checked={formData.gender === g.toLowerCase()}
                      onChange={handleInputChange}
                      className="mr-3 w-5 h-5 text-orange-500"
                    />
                    <span className="text-gray-700 font-medium">{g}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Room Selection */}
            <div className="mb-6">
              <label className="block mb-3 text-gray-700 font-semibold">
                Choose Room
              </label>
              <div className="grid gap-4">
                {roomOptions.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => handleRoomSelect(room.id)}
                    className={`p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                      formData.roomType === room.id
                        ? "border-orange-500 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-lg"
                        : "border-orange-200 hover:border-orange-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="text-orange-600">{room.icon}</div>
                        <div>
                          <span className="font-semibold text-gray-800">
                            {room.name}
                          </span>
                          <p className="text-sm text-gray-600 mt-1">
                            {room.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                          {room.price}
                        </span>
                        {formData.roomType === room.id && (
                          <CheckCircle className="w-6 h-6 text-green-500 mt-2 ml-auto" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transportation */}
            {/* <div className="mb-6">
              <label className="block mb-3 text-gray-700 font-semibold">
                Do you want transportation from Delhi and Jaipur? ?
              </label>
              <select
                name="transport"
                value={formData.transport}
                onChange={handleInputChange}
                className="w-full px-5 py-4 border-2 border-orange-200 rounded-2xl focus:border-orange-500 focus:outline-none transition-all duration-300"
                required
              >
                <option value="">Select Option</option>
                <option value="no">No</option>
                <option value="delhi">Yes</option>
              </select>
            </div> */}

            {/* Facilitator */}
            <div className="mb-6 mt-8">
              <label className="block mb-3 text-gray-700 font-semibold">
                Which preaching area are you connected to?
              </label>
              <select
                name="facilitator"
                value={formData.facilitator}
                onChange={handleInputChange}
                className="w-full px-5 py-4 border-2 border-orange-200 rounded-2xl focus:border-orange-500 focus:outline-none transition-all duration-300"
                required
              >
                <option value="">Select Preaching Area</option>
                <option value="Gita Essence">Gita Essence</option>
                <option value="ISKCON Jia Sarai">ISKCON Jia Sarai</option>
                <option value="ISKCON Srinagar">ISKCON Srinagar</option>
                <option value="Siksharthakam">Siksharthakam</option>
              </select>
            </div>

            {/* Preferred Room Partner */}
            <div className="mb-6">
              <label className="block mb-3 text-gray-700 font-semibold">
                Preferred Room Partner (Optional)
              </label>
              <input
                type="text"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                className="w-full px-5 py-4 border-2 border-orange-200 rounded-2xl focus:border-orange-500 focus:outline-none transition-all duration-300"
                placeholder="Enter name(s) of devotee(s) you'd prefer to share a room with"
              />
              <p className="text-sm text-gray-500 mt-2 italic">
                ⚠️ Note: We will try to consider this, but final room assignments depend on multiple factors and cannot be guaranteed.
              </p>
            </div>

            {/* Final Price Box */}
            {formData.roomType && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
                <div className="text-center">
                  <p className="text-gray-700 mb-2 font-semibold">
                    Final Price:
                  </p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    ₹{currentTotalPrice}
                  </p>

                  {/* Dynamic Info Text */}
                  <p className="text-sm text-gray-600 mt-2 italic">
                    {formData.transport === "delhi"
                      ? "(Includes internal bus travel, rooms and prasadam. Does not include ToTo or autoricksha.)"
                      : "(Includes rooms and prasadam. Does not include bus, ToTo or autoricksha.)"}
                  </p>
                </div>
              </div>
            )}

            {/* Total Price Display */}
            {/* {formData.roomType && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
                <div className="text-center">
                  <p className="text-gray-700 mb-2">Estimated Total Price:</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    ₹{currentTotalPrice}
                  </p>
                </div>
              </div>
            )} */}

            <div className="container mx-auto px-4 py-4">
              <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-orange-100">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                    Complete Your Payment
                  </h2>
                  <p className="text-gray-600">
                    You can reserve your seat by paying just ₹2000 now. The
                    remaining amount can be paid later.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-4 sm:p-6 mb-6 text-center border border-orange-200 max-w-md mx-auto">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Scan QR Code
                  </h3>

                  {/* ✅ UPI ID Section */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-6">
                    <span className="text-gray-800 font-medium text-sm sm:text-base">
                      UPI ID:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                      <span className="font-semibold text-orange-600 select-all text-sm sm:text-base break-all">
                        govindam.tkb@ybl
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText("govindam.tkb@ybl@ybl");
                          alert("UPI ID copied!");
                        }}
                        className="px-3 py-1 text-xs sm:text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all whitespace-nowrap"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-3 sm:p-4 inline-block shadow-lg">
                    <img
                      src={`./images/qrCode.jpg`}
                      alt="QR Code"
                      className="mx-auto w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 border rounded-lg"
                    />
                  </div>

                  {/* Upload Payment Proof */}
                  <div className="mt-6 text-center">
                    {/* Hidden File Input */}
                    <input
                      type="file"
                      accept="image/*"
                      id="fileUpload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          // Show preview
                          setPaymentProof(URL.createObjectURL(file));
                          // Save file temporarily for upload
                          setFormData((prev) => ({
                            ...prev,
                            selectedFile: file,
                          }));
                        }
                      }}
                    />

                    {/* Styled Button */}
                    <label
                      htmlFor="fileUpload"
                      className="w-full inline-block bg-orange-100 bg-opacity-60 text-orange-700 py-3 rounded-xl font-semibold text-center cursor-pointer hover:bg-orange-200 hover:bg-opacity-80 hover:scale-105 transition-all duration-300 text-sm sm:text-base"
                    >
                      Choose File
                    </label>

                    {/* Preview */}
                    {paymentProof && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Preview:</p>
                        <img
                          src={paymentProof}
                          alt="Payment Proof Preview"
                          className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-cover rounded-xl border mx-auto"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={async (e) => {
                setIsSubmitting(true);
                await handleFileUpload(formData.selectedFile, e);
              }}
              disabled={isSubmitting}
              className={`w-full py-5 rounded-2xl text-white font-bold text-lg transition-all duration-300 ${
                isSubmitting
                  ? "bg-gray-400"
                  : "bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:scale-105 hover:shadow-xl shadow-lg"
              }`}
            >
              {isSubmitting ? "Processing..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
      (
      {/* <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50"> */}
      {/* Slider Header for Payment */}
      {/* <div className="relative h-80 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={sliderImages[currentSlide]}
              alt="Hotel"
              className="w-full h-full object-cover transition-all duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/80 via-red-500/80 to-pink-600/80"></div>
          </div>
          <div className="relative z-10 flex items-center justify-center h-full">
            <div className="text-center px-4">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                Payment Portal
              </h1>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 inline-block">
                <span className="text-white text-lg font-semibold">
                  Secure Payment Gateway
                </span>
              </div>
            </div>
          </div>
        </div> */}
      {/* </div> */}
      );
    </div>
  );
};

export default RoomBookingPortal;
